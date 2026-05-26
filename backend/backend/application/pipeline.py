"""Application orchestration for the GenIA E2E pipeline."""

from __future__ import annotations

import asyncio
import html
import json
import logging
import os
import re
import queue
import threading
import traceback
import uuid
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

try:
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, LLMConfig, CrawlerRunConfig
    from crawl4ai.extraction_strategy import LLMExtractionStrategy
except ImportError:  # pragma: no cover - optional runtime dependency
    AsyncWebCrawler = None
    BrowserConfig = None
    CacheMode = None
    LLMConfig = None
    CrawlerRunConfig = None
    LLMExtractionStrategy = None

from backend.application.prompts import PromptManager
from backend.domain.frameworks import get_available_frameworks, get_framework_languages
from backend.domain.models import (
    ExecutionResult,
    ExecutionStep,
    ExtractedElement,
    Module,
    PipelineSessionState,
    PipelineStage,
    TestCase,
)
from backend.infrastructure.executor import TestExecutor
from backend.infrastructure.llm_factory import LLMFactory


logger = logging.getLogger(__name__)


def _model_dump(value: Any) -> Any:
    return value.model_dump() if hasattr(value, "model_dump") else value


def _model_dump_list(items: List[Any]) -> List[Any]:
    return [_model_dump(item) for item in items]


def _json_safe(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return _json_safe(value.model_dump())
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, tuple):
        return [_json_safe(item) for item in value]
    if isinstance(value, Enum):
        return value.value
    return value


def _safe_json_dumps(value: Any) -> str:
    return json.dumps(_json_safe(value), ensure_ascii=False, indent=2)


def _render_prompt(template: str, **values: Any) -> str:
    rendered = template
    for key, value in values.items():
        rendered = rendered.replace(f"{{{key}}}", _safe_json_dumps(value) if not isinstance(value, str) else value)
    return rendered


def _append_context_block(prompt: str, context: Any) -> str:
    prompt = prompt.rstrip()
    return f"{prompt}\n\nCONTEXT PAYLOAD:\n{_safe_json_dumps(context)}"


def _truncate_text(value: Any, limit: int = 1200) -> Any:
    if not isinstance(value, str):
        return value
    if len(value) <= limit:
        return value
    return f"{value[:limit].rstrip()}... [truncated]"


def _compact_html_snapshot(value: Any, limit: int = 12000) -> str:
    if not isinstance(value, str):
        return ""
    compacted = re.sub(r"\s+", " ", value).strip()
    if len(compacted) <= limit:
        return compacted
    half = max(1, limit // 2)
    head = compacted[:half].rstrip()
    tail = compacted[-half:].lstrip()
    return f"{head} ... [truncated] ... {tail}"


def _compact_log_entries(entries: Any, limit: int = 80, text_limit: int = 300) -> list[dict[str, Any]]:
    if not isinstance(entries, list):
        return []
    compacted = []
    for item in entries[-limit:]:
        if not isinstance(item, dict):
            continue
        compacted.append(
            {
                "timestamp": item.get("timestamp"),
                "level": item.get("level"),
                "stage": item.get("stage"),
                "message": _truncate_text(item.get("message"), text_limit),
                "type": item.get("type"),
            }
        )
    return compacted


def _compact_sequence(items: Any, limit: int = 25) -> list[Any]:
    if not isinstance(items, list):
        return []
    return [_json_safe(item) for item in items[-limit:]]


def _compact_history_entries(entries: Any, limit: int = 25) -> list[dict[str, Any]]:
    if not isinstance(entries, list):
        return []
    compacted = []
    for item in entries[-limit:]:
        if not isinstance(item, dict):
            continue
        payload = item.get("payload")
        payload_keys = list(payload.keys())[:12] if isinstance(payload, dict) else []
        compacted.append(
            {
                "timestamp": item.get("timestamp"),
                "stage": item.get("stage"),
                "event": item.get("event") or item.get("event_type"),
                "payload_keys": payload_keys,
            }
        )
    return compacted


def _compact_timeline_entries(entries: Any, limit: int = 30) -> list[dict[str, Any]]:
    if not isinstance(entries, list):
        return []
    compacted = []
    for item in entries[-limit:]:
        if not isinstance(item, dict):
            continue
        payload = item.get("payload")
        payload_keys = list(payload.keys())[:12] if isinstance(payload, dict) else []
        compacted.append(
            {
                "timestamp": item.get("timestamp"),
                "stage": item.get("stage"),
                "event_type": item.get("event_type"),
                "payload_keys": payload_keys,
            }
        )
    return compacted


def _compact_execution_result(execution_result: Any) -> dict[str, Any]:
    data = _model_dump(execution_result)
    if not isinstance(data, dict):
        return {"value": _truncate_text(str(data), 1500)}
    return {
        "status": data.get("status"),
        "framework": data.get("framework"),
        "language": data.get("language"),
        "runtime": data.get("runtime"),
        "duration_seconds": data.get("duration_seconds"),
        "exit_code": data.get("exit_code"),
        "stdout": _truncate_text(data.get("stdout"), 1800),
        "stderr": _truncate_text(data.get("stderr"), 1800),
        "stacktrace": _truncate_text(data.get("stacktrace"), 1800),
        "logs": _compact_sequence(data.get("logs") or data.get("execution_log_lines") or [], 20),
        "screenshots": _compact_sequence(data.get("screenshots") or [], 10),
        "traces": _compact_sequence(data.get("traces") or [], 10),
        "evidence": _compact_sequence(data.get("evidence") or [], 10),
        "test_results": _json_safe(data.get("test_results") or {}),
    }


def _compact_execution_artifacts(execution_result: Any) -> dict[str, Any]:
    data = _model_dump(execution_result)
    if not isinstance(data, dict):
        return {"screenshots": [], "primary_screenshot": None, "image_evidence": []}

    screenshots = [path for path in (data.get("screenshots") or []) if isinstance(path, str) and path.strip()]
    evidence = [path for path in (data.get("evidence") or []) if isinstance(path, str) and path.strip()]
    image_evidence = [
        path
        for path in evidence
        if Path(path).suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
    ]
    combined_screenshots = screenshots or image_evidence

    return {
        "screenshots": _compact_sequence(combined_screenshots, 5),
        "primary_screenshot": combined_screenshots[0] if combined_screenshots else None,
        "image_evidence": _compact_sequence(image_evidence, 5),
        "screenshot_count": len(combined_screenshots),
        "evidence_count": len(evidence),
    }


def _compact_module_snapshot(module: Any, html_limit: int = 12000) -> dict[str, Any]:
    data = _model_dump(module)
    if not isinstance(data, dict):
        return {"value": _truncate_text(str(data), 1500)}
    source_html = data.get("source_html") or ""
    return {
        "url": data.get("url"),
        "purpose": data.get("purpose"),
        "execution_steps": _compact_sequence(data.get("execution_steps") or [], 50),
        "extracted_data": _compact_sequence(data.get("extracted_data") or [], 50),
        "source_html": _compact_html_snapshot(source_html, html_limit) if source_html else "",
    }


def _require_crawl4ai() -> None:
    if AsyncWebCrawler is None:
        raise RuntimeError(
            "crawl4ai is not installed in this environment. "
            "Install the backend dependencies to use extraction and refinement."
        )
    if BrowserConfig is not None:
        try:
            BrowserConfig.set_defaults(
                browser_mode="dedicated",
                cache_cdp_connection=True,
                cdp_close_delay=0,
                create_isolated_context=True,
            )
        except Exception:
            pass


def _create_browser_config(headless: bool) -> Any:
    return BrowserConfig(
        browser_type="chromium",
        browser_mode="dedicated",
        headless=headless,
        verbose=True,
        cache_cdp_connection=True,
        cdp_close_delay=0,
        create_isolated_context=True,
    )


def _is_crawl4ai_browser_lifecycle_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return any(
        marker in text
        for marker in (
            "target page, context or browser has been closed",
            "browser has been closed",
            "browser closed",
        )
    )


def _iso_now() -> str:
    return datetime.now().isoformat()


def _normalize_manual_changes(manual_changes: Any) -> dict[str, Any]:
    if not manual_changes:
        return {}
    if isinstance(manual_changes, dict):
        return manual_changes
    if isinstance(manual_changes, list):
        return {"manual_inputs": manual_changes}
    return {"value": manual_changes}


def _build_timeline_payload(session: dict[str, Any], stage: str, event_type: str, payload: Any) -> dict[str, Any]:
    return {
        "timestamp": _iso_now(),
        "stage": stage,
        "event": event_type,
        "payload": _json_safe(payload),
    }


class PipelineStageRunner:
    def __init__(self, llm_provider, prompt_manager: PromptManager):
        self.llm = llm_provider
        self.prompt_manager = prompt_manager

    def log(self, message: str, level: str = "info", stage: str = "") -> None:
        stage_prefix = f"[{stage}] " if stage else ""
        getattr(logger, level, logger.info)(f"{stage_prefix}{message}")
        print(f"[GenIA Pipeline] {stage_prefix}{message}", flush=True)


class StructuringStage(PipelineStageRunner):
    async def execute(
        self,
        test_case: str,
        api_key: str,
        model: str,
        provider: str,
        temperature: float = 0.0,
        input_mode: str = "test_case",
        user_story_content: str | None = None,
        user_story_filename: str | None = None,
        manual_urls: list[str] | None = None,
        prompt_override: str | None = None,
    ) -> TestCase:
        prompt_key = "structuring_user_history" if input_mode == "user_story" else "structuring"
        prompt = prompt_override or self.prompt_manager.load_prompt(prompt_key)
        final_prompt = _append_context_block(
            _render_prompt(
                prompt,
                Test_Case=test_case,
                test_case=test_case,
                input_mode=input_mode,
                user_story_content=user_story_content or "",
                user_story_filename=user_story_filename or "",
                manual_urls=manual_urls or [],
            ),
            {
                "test_case": test_case,
                "input_mode": input_mode,
                "user_story_content": user_story_content or "",
                "user_story_filename": user_story_filename or "",
                "manual_urls": manual_urls or [],
            },
        )
        result = self.llm.generate_json(api_key, model, final_prompt, temperature=temperature)
        return TestCase(**result)


class ExtractionStage(PipelineStageRunner):
    async def execute(
        self,
        crawler: AsyncWebCrawler,
        module: Module,
        api_key: str,
        model: str,
        provider: str,
        temperature: float = 0.0,
        headless: bool = True,
        prompt_override: str | None = None,
    ) -> List[ExtractedElement]:
        prompt = prompt_override or self.prompt_manager.load_prompt("extraction")
        final_prompt = _append_context_block(
            _render_prompt(
                prompt,
                Test_Case_Structured=module,
                structured_test_case=module,
                module_context=module,
            ),
            {"structured_test_case": module, "module": module},
        )

        llm_strategy = LLMExtractionStrategy(
            llm_config=LLMConfig(provider=f"{provider}/{model}", api_token=api_key),
            schema=ExtractedElement.model_json_schema(),
            extraction_type="schema",
            input_format="html",
            extra_args={"temperature": temperature},
            instruction=final_prompt,
        )

        crawl_config = CrawlerRunConfig(
            verbose=True,
            word_count_threshold=1,
            extraction_strategy=llm_strategy,
            cache_mode=CacheMode.BYPASS,
            wait_until="domcontentloaded",
            page_timeout=120000,
            delay_before_return_html=0.5,
            screenshot=False,
        )

        result = await crawler.arun(url=module.url, config=crawl_config)
        if not result.success:
            error_message = getattr(result, "error_message", None) or f"Crawling failed for {module.url}"
            raise RuntimeError(error_message)

        html_snapshot = _extract_html_snapshot(result)
        if html_snapshot:
            module.source_html = _compact_html_snapshot(html_snapshot)

        extracted_items = json.loads(result.extracted_content)
        return [ExtractedElement(**item) for item in extracted_items]


class RefinementStage(PipelineStageRunner):
    async def execute(
        self,
        crawler: Any,
        module: Module,
        api_key: str,
        model: str,
        provider: str,
        temperature: float = 0.0,
        headless: bool = True,
        prompt_override: str | None = None,
    ) -> List[ExtractedElement]:
        del crawler, headless
        prompt = prompt_override or self.prompt_manager.load_prompt("refinement")
        structured_module = _compact_module_snapshot(module)
        extracted_elements = _model_dump_list(module.extracted_data or [])
        source_html = _compact_html_snapshot(module.source_html or "")
        final_prompt = _render_prompt(
            prompt,
            structured_json=structured_module,
            refined_module=structured_module,
            extracted_elements=extracted_elements,
            source_html=source_html,
            refinement_context={
                "module": structured_module,
                "extracted_elements": extracted_elements,
                "source_html": source_html,
            },
        )
        raw = self.llm.generate_json(api_key, model, final_prompt, temperature=temperature)
        return _normalize_extracted_elements(raw)


class GenerationStage(PipelineStageRunner):
    async def execute(
        self,
        test_case: TestCase,
        framework: str,
        language: str,
        api_key: str,
        model: str,
        provider: str,
        temperature: float = 0.0,
        prompt_override: str | None = None,
    ) -> str:
        prompt_template = prompt_override or self.prompt_manager.load_generation_prompt(framework)
        final_prompt = _append_context_block(
            _render_prompt(
                prompt_template,
                language=language,
                framework=framework,
                test_case=test_case,
            )
            + f"\n\nLanguage: {language}\n\nTest Case Data:\n{_safe_json_dumps(test_case)}",
            {
                "framework": framework,
                "language": language,
                "test_case": test_case,
            },
        )
        return self.llm.generate_text(api_key, model, final_prompt, temperature=temperature)


class ValidationStage(PipelineStageRunner):
    async def execute(
        self,
        script: str,
        test_case: TestCase,
        api_key: str,
        model: str,
        provider: str,
        temperature: float = 0.0,
        prompt_override: str | None = None,
    ) -> Dict[str, Any]:
        prompt = prompt_override or self.prompt_manager.load_prompt("validation")
        final_prompt = _append_context_block(
            _render_prompt(
                prompt,
                generated_script=script,
                script=script,
                refined_test_case=test_case,
                structured_test_case=test_case,
                validation_context={
                    "script": script,
                    "test_case": test_case,
                },
            ),
            {
                "generated_script": script,
                "refined_test_case": test_case,
                "structured_test_case": test_case,
                "validation_context": {
                    "script": script,
                    "test_case": test_case,
                },
            },
        )
        variables_raw = self.llm.generate_json(api_key, model, final_prompt, temperature=temperature)
        return self._normalize_variables(variables_raw)

    def _normalize_variables(self, raw_variables: Any) -> Dict[str, Any]:
        if not raw_variables:
            return {"detected_inputs": [], "editable_fields": []}

        if isinstance(raw_variables, dict):
            inputs = raw_variables.get("detected_inputs", raw_variables.get("variables", []))
            editable_fields = raw_variables.get("editable_fields", [])
            if not isinstance(inputs, list):
                inputs = [inputs] if inputs else []
            if not isinstance(editable_fields, list):
                editable_fields = [editable_fields] if editable_fields else []
        elif isinstance(raw_variables, list):
            inputs = raw_variables
            editable_fields = raw_variables
        else:
            inputs = []
            editable_fields = []

        normalized_inputs = []
        normalized_editable_fields = []

        for i, var in enumerate(inputs):
            if isinstance(var, dict):
                name = var.get("variable_name") or var.get("name") or var.get("variable") or f"variable_{i + 1}"
                current_value = var.get("current_value", var.get("value", var.get("suggestedValue", var.get("suggested_value", ""))))
                normalized_inputs.append(
                    {
                        "variable_name": name,
                        "current_value": current_value,
                        "description": var.get("description", "Detectada automaticamente"),
                        "type": var.get("type", "string"),
                        "required": bool(var.get("required", True)),
                        "related_steps": var.get("related_steps", []),
                    }
                )
                normalized_editable_fields.append(
                    {
                        "name": name,
                        "value": current_value,
                        "description": var.get("description", "Detectada automaticamente"),
                        "editable": True,
                    }
                )
            else:
                normalized_inputs.append(
                    {
                        "variable_name": f"variable_{i + 1}",
                        "current_value": str(var),
                        "description": "Detectada automaticamente",
                        "type": "string",
                        "required": True,
                        "related_steps": [],
                    }
                )
                normalized_editable_fields.append(
                    {
                        "name": f"variable_{i + 1}",
                        "value": str(var),
                        "description": "Detectada automaticamente",
                        "editable": True,
                    }
                )

        return {"detected_inputs": normalized_inputs, "editable_fields": normalized_editable_fields}


class ConfirmationStage(PipelineStageRunner):
    async def execute(
        self,
        script: str,
        manual_changes: Dict[str, Any],
        api_key: str,
        model: str,
        provider: str,
        temperature: float = 0.0,
        prompt_override: str | None = None,
    ) -> str:
        prompt = prompt_override or self.prompt_manager.load_prompt("confirmation")
        final_prompt = _append_context_block(
            _render_prompt(
                prompt,
                refined_test=script,
                generation_script=script,
                manual_inputs=manual_changes,
                validation_changes=manual_changes,
                manual_changes=manual_changes,
                confirmation_context={
                    "script": script,
                    "manual_changes": manual_changes,
                },
            ),
            {
                "script": script,
                "manual_changes": manual_changes,
                "generation_script": script,
                "validation_changes": manual_changes,
            },
        )
        return self.llm.generate_text(api_key, model, final_prompt, temperature=temperature)


class ExecutionStage(PipelineStageRunner):
    async def execute(
        self,
        script: str,
        framework: str,
        language: str,
        log_callback: Optional[Callable[[str, str], None]] = None,
    ) -> ExecutionResult:
        return TestExecutor().execute(framework, script, language=language, log_callback=log_callback)


class HomologationStage(PipelineStageRunner):
    async def execute(
        self,
        execution_result: ExecutionResult,
        refined: Any,
        validation_data: Dict[str, Any],
        manual_changes: Dict[str, Any],
        script: str,
        api_key: str,
        model: str,
        provider: str,
        temperature: float = 0.0,
        prompt_override: str | None = None,
    ) -> Dict[str, Any]:
        prompt = prompt_override or self.prompt_manager.load_prompt("homologation")
        visual_context = _compact_execution_artifacts(execution_result)
        final_prompt = _append_context_block(
            _render_prompt(
                prompt,
                execution_results=execution_result,
                execution=execution_result,
                execution_screenshots=visual_context.get("screenshots"),
                primary_screenshot=visual_context.get("primary_screenshot"),
                image_evidence=visual_context.get("image_evidence"),
                refined_data=refined,
                refined=refined,
                validation_data=validation_data,
                manual_changes=manual_changes,
                manual=manual_changes,
                generated_script=script,
                script=script,
                homologation_context={
                    "execution_result": execution_result,
                    "visual_context": visual_context,
                    "refined": refined,
                    "validation": validation_data,
                    "manual_changes": manual_changes,
                    "script": script,
                },
            ),
            {
                "execution_results": execution_result,
                "execution_screenshots": visual_context.get("screenshots"),
                "primary_screenshot": visual_context.get("primary_screenshot"),
                "image_evidence": visual_context.get("image_evidence"),
                "refined_data": refined,
                "validation_data": validation_data,
                "manual_changes": manual_changes,
                "generated_script": script,
            },
        )
        result = self.llm.generate_json(api_key, model, final_prompt, temperature=temperature)
        return _json_safe(result)


class FinalizationStage(PipelineStageRunner):
    async def execute(
        self,
        payload: Dict[str, Any],
        api_key: str,
        model: str,
        provider: str,
        temperature: float = 0.0,
        prompt_override: str | None = None,
    ) -> Dict[str, Any]:
        prompt = prompt_override or self.prompt_manager.load_prompt("finalization")
        execution_artifacts = _compact_execution_artifacts(payload.get("execution"))
        homologation_artifacts = _compact_execution_artifacts(payload.get("execution"))
        final_prompt = _render_prompt(
            prompt,
            final_report=payload,
            pipeline_context={
                "pipeline_id": payload.get("pipeline_id"),
                "inputs": payload.get("inputs"),
                "structured": payload.get("structured"),
                "extracted": payload.get("extracted"),
                "refined": payload.get("refined"),
                "script": payload.get("script"),
                "execution": payload.get("execution"),
                "homologation": payload.get("homologation"),
                "timeline": payload.get("timeline"),
                "logs": payload.get("logs"),
                "prompts_used": payload.get("prompts_used"),
                "execution_artifacts": execution_artifacts,
                "homologation_artifacts": homologation_artifacts,
            },
            execution_results=payload.get("execution"),
            execution_screenshots=execution_artifacts.get("screenshots"),
            primary_screenshot=execution_artifacts.get("primary_screenshot"),
            image_evidence=execution_artifacts.get("image_evidence"),
            homologation_results=payload.get("homologation"),
            homologation_screenshots=homologation_artifacts.get("screenshots"),
            validation_data=payload.get("inputs", {}).get("validation"),
            manual_changes=payload.get("inputs", {}).get("manual_changes"),
            logs=payload.get("logs"),
            timeline=payload.get("timeline"),
        )
        result = self.llm.generate_json(api_key, model, final_prompt, temperature=temperature)
        return _json_safe(result)


class RefactoringStage(PipelineStageRunner):
    async def execute(
        self,
        original_script: str,
        execution_result: ExecutionResult,
        homologation: Dict[str, Any],
        final_report: Dict[str, Any],
        api_key: str,
        model: str,
        provider: str,
        temperature: float = 0.0,
        prompt_override: str | None = None,
    ) -> Dict[str, Any]:
        prompt = prompt_override or self.prompt_manager.load_prompt("refactoring")
        execution_artifacts = _compact_execution_artifacts(execution_result)
        confirmed_script = (
            final_report.get("script", {}).get("confirmed", original_script)
            if isinstance(final_report, dict)
            else original_script
        )
        final_prompt = _append_context_block(
            _render_prompt(
                prompt,
                original_script=original_script,
                script=original_script,
                confirmed_script=confirmed_script,
                execution_results=execution_result,
                execution=execution_result,
                execution_screenshots=execution_artifacts.get("screenshots"),
                primary_screenshot=execution_artifacts.get("primary_screenshot"),
                image_evidence=execution_artifacts.get("image_evidence"),
                homologation_results=homologation,
                homologation=homologation,
                finalization_context=final_report,
                final_report=final_report,
                refactoring_context={
                    "original_script": original_script,
                    "confirmed_script": confirmed_script,
                    "execution_result": execution_result,
                    "visual_context": execution_artifacts,
                    "homologation": homologation,
                    "final_report": final_report,
                },
            ),
            {
                "original_script": original_script,
                "confirmed_script": confirmed_script,
                "execution_result": execution_result,
                "execution_screenshots": execution_artifacts.get("screenshots"),
                "primary_screenshot": execution_artifacts.get("primary_screenshot"),
                "image_evidence": execution_artifacts.get("image_evidence"),
                "homologation": homologation,
                "final_report": final_report,
            },
        )
        result = self.llm.generate_json(api_key, model, final_prompt, temperature=temperature)
        return _json_safe(result)


def _map_extracted_data_to_steps(module: Module):
    extracted_items = module.extracted_data or []
    normalized_items = []

    for item in extracted_items:
        if isinstance(item, dict):
            normalized_items.append(ExtractedElement(**item))
        elif isinstance(item, ExtractedElement):
            normalized_items.append(item)

    for step in module.execution_steps:
        matched_data = [item.model_copy() for item in normalized_items if item.step_name == step.step]
        if matched_data:
            step.extracted_data = matched_data

    return module


def _extract_html_snapshot(result: Any) -> str | None:
    for attr in ("html", "raw_html", "page_source", "cleaned_html", "markdown"):
        value = getattr(result, attr, None)
        if isinstance(value, str) and value.strip():
            return value
    return None


def _normalize_extracted_elements(raw: Any) -> List[ExtractedElement]:
    if not raw:
        return []

    if isinstance(raw, dict):
        candidates = raw.get("items") or raw.get("elements") or raw.get("extracted_elements") or raw.get("data") or []
    else:
        candidates = raw

    if not isinstance(candidates, list):
        candidates = [candidates]

    normalized: list[ExtractedElement] = []
    for item in candidates:
        if isinstance(item, ExtractedElement):
            normalized.append(item)
        elif isinstance(item, dict):
            normalized.append(ExtractedElement(**item))
    return normalized


def _sanitize_module_tree(test_case: TestCase | dict[str, Any]) -> dict[str, Any]:
    payload = _model_dump(test_case)
    modules = payload.get("modules", []) if isinstance(payload, dict) else []
    for module in modules:
        if isinstance(module, dict) and "extracted_data" in module:
            module["extracted_data"] = []
    return payload


def _build_execution_report_html(final_report: Dict[str, Any]) -> str:
    sections = []
    for key, value in final_report.items():
        sections.append(
            f"<section><h2>{html.escape(str(key))}</h2><pre>{html.escape(json.dumps(_json_safe(value), ensure_ascii=False, indent=2))}</pre></section>"
        )
    return "<html><body>" + "".join(sections) + "</body></html>"


def _build_execution_report_markdown(final_report: Dict[str, Any]) -> str:
    lines = ["# Finalization Report", ""]
    for key, value in final_report.items():
        lines.append(f"## {key}")
        lines.append("```json")
        lines.append(json.dumps(_json_safe(value), ensure_ascii=False, indent=2))
        lines.append("```")
        lines.append("")
    return "\n".join(lines)


class GenIAOrchestrator:
    def __init__(self, prompts_dir: str = "prompts"):
        self.prompt_manager = PromptManager(prompts_dir)
        self.execution_logs: list[dict[str, Any]] = []
        self.pipeline_sessions: dict[str, dict[str, Any]] = {}
        self.llm_provider = None
        self.current_provider = ""
        self.current_model = ""
        self.current_api_key = ""
        self.current_temperature = 0.0
        self._session_lock = threading.Lock()
        self._pipeline_lock = threading.Lock()

    def set_provider(self, provider: str, api_key: str, model: str, temperature: float | None = None) -> None:
        self.llm_provider = LLMFactory.get_provider(provider)
        self.current_provider = provider
        self.current_model = model
        self.current_api_key = api_key
        self.current_temperature = float(temperature if temperature is not None else self.current_temperature or 0.0)

    def _resolve_stage_llm(self, stage: str, llm_overrides: Dict[str, Any] | None = None) -> tuple[str, str, str, float]:
        override = (llm_overrides or {}).get(stage) or {}
        provider = override.get("provider") or self.current_provider
        model = override.get("model") or self.current_model
        api_key = override.get("apiKey") or override.get("api_key") or self.current_api_key
        temperature = override.get("temperature")
        if temperature is None:
            temperature = self.current_temperature
        try:
            temperature = float(temperature)
        except (TypeError, ValueError):
            temperature = float(self.current_temperature or 0.0)
        return provider, model, api_key, temperature

    def _create_session(self, pipeline_id: str, **data: Any) -> dict[str, Any]:
        with self._session_lock:
            existing = self.pipeline_sessions.get(pipeline_id)
            if existing:
                existing["data"].update(data)
                existing["state"] = "INITIAL"
                existing["paused_at"] = None
                existing["updated_at"] = _iso_now()
                session = existing
            else:
                session = {
                    "id": pipeline_id,
                    "state": "INITIAL",
                    "data": data,
                    "history": [],
                    "timeline": [],
                    "paused_at": None,
                    "created_at": _iso_now(),
                    "updated_at": _iso_now(),
                    "queue": queue.Queue(),
                }
                self.pipeline_sessions[pipeline_id] = session
        return session

    def _get_session(self, pipeline_id: str) -> dict[str, Any] | None:
        with self._session_lock:
            return self.pipeline_sessions.get(pipeline_id)

    def _set_session_state(self, pipeline_id: str, state: str) -> None:
        session = self._get_session(pipeline_id)
        if not session:
            return
        session["state"] = state
        session["updated_at"] = _iso_now()

    def log(self, message: str, level: str = "info", stage: str = "") -> None:
        timestamp = _iso_now()
        self.execution_logs.append(
            {
                "timestamp": timestamp,
                "level": level,
                "message": message,
                "stage": stage,
                "type": level,
            }
        )
        stage_prefix = f"[{stage}] " if stage else ""
        logger.log(getattr(logging, level.upper(), logging.INFO), f"{stage_prefix}{message}")
        print(f"[GenIA Backend] {stage_prefix}{message}", flush=True)

    def push_event(self, event_type: str, channel: str, payload: Any, pipeline_id: str | None = None):
        if isinstance(payload, dict):
            message = payload.get("message") or payload.get("stage") or payload.get("channel") or event_type
        else:
            message = str(payload)

        event = {
            "id": str(uuid.uuid4()),
            "timestamp": _iso_now(),
            "type": event_type,
            "channel": channel,
            "payload": _json_safe(payload),
            "message": message,
        }
        self.execution_logs.append(
            {
                "timestamp": event["timestamp"],
                "level": self._get_level_from_event_type(event_type),
                "message": message,
                "stage": channel,
                "type": self._get_level_from_event_type(event_type),
                "event_type": event_type,
            }
        )
        print(f"[EVENT:{event_type}][{channel}] {message}", flush=True)

        if pipeline_id:
            session = self._get_session(pipeline_id)
            if session:
                session["history"].append(_build_timeline_payload(session, channel, event_type, payload))
                session["timeline"].append(
                    {
                        "timestamp": event["timestamp"],
                        "stage": channel,
                        "event_type": event_type,
                        "payload": _json_safe(payload),
                    }
                )
                session["updated_at"] = _iso_now()
                session["queue"].put(event)

        return event

    def _get_level_from_event_type(self, event_type: str) -> str:
        if "ERROR" in event_type or "FAILED" in event_type:
            return "error"
        if "SUCCESS" in event_type or "DONE" in event_type or "PASSED" in event_type:
            return "success"
        if "START" in event_type or "PAUSED" in event_type:
            return "info"
        return "info"

    async def run_structuring(
        self,
        test_case: str,
        input_mode: str = "test_case",
        user_story_content: str | None = None,
        user_story_filename: str | None = None,
        manual_urls: list[str] | None = None,
        prompt_override: str | None = None,
        temperature: float | None = None,
    ) -> TestCase:
        return await StructuringStage(self.llm_provider, self.prompt_manager).execute(
            test_case,
            self.current_api_key,
            self.current_model,
            self.current_provider,
            temperature=temperature if temperature is not None else self.current_temperature,
            input_mode=input_mode,
            user_story_content=user_story_content,
            user_story_filename=user_story_filename,
            manual_urls=manual_urls,
            prompt_override=prompt_override,
        )

    async def run_extraction(
        self,
        module: Module,
        headless: bool = True,
        temperature: float | None = None,
        prompt_override: str | None = None,
    ) -> List[ExtractedElement]:
        _require_crawl4ai()
        browser_config = _create_browser_config(headless)
        crawler = AsyncWebCrawler(config=browser_config)
        try:
            await crawler.start()
            return await ExtractionStage(self.llm_provider, self.prompt_manager).execute(
                crawler,
                module,
                self.current_api_key,
                self.current_model,
                self.current_provider,
                temperature=temperature if temperature is not None else self.current_temperature,
                headless=headless,
                prompt_override=prompt_override,
            )
        finally:
            try:
                await crawler.close()
            except Exception:
                pass

    async def run_refinement(
        self,
        module: Module,
        headless: bool = True,
        temperature: float | None = None,
        prompt_override: str | None = None,
    ) -> List[ExtractedElement]:
        return await RefinementStage(self.llm_provider, self.prompt_manager).execute(
            None,
            module,
            self.current_api_key,
            self.current_model,
            self.current_provider,
            temperature=temperature if temperature is not None else self.current_temperature,
            headless=headless,
            prompt_override=prompt_override,
        )

    async def run_generation(
        self,
        test_case: TestCase,
        framework: str,
        language: str,
        temperature: float | None = None,
        prompt_override: str | None = None,
    ) -> str:
        return await GenerationStage(self.llm_provider, self.prompt_manager).execute(
            test_case,
            framework,
            language,
            self.current_api_key,
            self.current_model,
            self.current_provider,
            temperature=temperature if temperature is not None else self.current_temperature,
            prompt_override=prompt_override,
        )

    async def run_validation(
        self,
        script: str,
        test_case: TestCase,
        temperature: float | None = None,
        prompt_override: str | None = None,
    ) -> Dict[str, Any]:
        return await ValidationStage(self.llm_provider, self.prompt_manager).execute(
            script,
            test_case,
            self.current_api_key,
            self.current_model,
            self.current_provider,
            temperature=temperature if temperature is not None else self.current_temperature,
            prompt_override=prompt_override,
        )

    async def run_confirmation(
        self,
        refined_script: str,
        manual_changes: Dict[str, Any],
        temperature: float | None = None,
        prompt_override: str | None = None,
        llm_override: Dict[str, Any] | None = None,
    ) -> str:
        provider, model, api_key, resolved_temperature = self._resolve_stage_llm("confirmation", {"confirmation": llm_override} if llm_override else None)
        return await ConfirmationStage(self.llm_provider, self.prompt_manager).execute(
            refined_script,
            manual_changes,
            api_key,
            model,
            provider,
            temperature=temperature if temperature is not None else resolved_temperature,
            prompt_override=prompt_override,
        )

    async def run_execution(self, script: str, framework: str, language: str, log_callback=None):
        return await ExecutionStage(self.llm_provider, self.prompt_manager).execute(
            script,
            framework,
            language,
            log_callback=log_callback,
        )

    async def run_homologation(
        self,
        execution_result: ExecutionResult,
        refined: Any,
        validation_data: Dict[str, Any],
        manual_changes: Dict[str, Any],
        script: str,
        temperature: float | None = None,
        prompt_override: str | None = None,
        llm_override: Dict[str, Any] | None = None,
    ):
        provider, model, api_key, resolved_temperature = self._resolve_stage_llm("homologation", {"homologation": llm_override} if llm_override else None)
        return await HomologationStage(self.llm_provider, self.prompt_manager).execute(
            execution_result,
            refined,
            validation_data,
            manual_changes,
            script,
            api_key,
            model,
            provider,
            temperature=temperature if temperature is not None else resolved_temperature,
            prompt_override=prompt_override,
        )

    async def run_finalization(
        self,
        payload: Dict[str, Any],
        temperature: float | None = None,
        prompt_override: str | None = None,
        llm_override: Dict[str, Any] | None = None,
    ):
        provider, model, api_key, resolved_temperature = self._resolve_stage_llm("finalization", {"finalization": llm_override} if llm_override else None)
        return await FinalizationStage(self.llm_provider, self.prompt_manager).execute(
            payload,
            api_key,
            model,
            provider,
            temperature=temperature if temperature is not None else resolved_temperature,
            prompt_override=prompt_override,
        )

    async def run_refactoring(
        self,
        original_script: str,
        execution_result: ExecutionResult,
        homologation: Dict[str, Any],
        final_report: Dict[str, Any],
        temperature: float | None = None,
        prompt_override: str | None = None,
        llm_override: Dict[str, Any] | None = None,
    ):
        provider, model, api_key, resolved_temperature = self._resolve_stage_llm("refactoring", {"refactoring": llm_override} if llm_override else None)
        return await RefactoringStage(self.llm_provider, self.prompt_manager).execute(
            original_script,
            execution_result,
            homologation,
            final_report,
            api_key,
            model,
            provider,
            temperature=temperature if temperature is not None else resolved_temperature,
            prompt_override=prompt_override,
        )

    async def run_full_pipeline_1(
        self,
        test_case: str,
        framework: str,
        language: str,
        test_name: str | None = None,
        headless: bool = True,
        attempt: int = 1,
        pipeline_id: str | None = None,
        prompt_overrides: Dict[str, str] | None = None,
        llm_overrides: Dict[str, Any] | None = None,
        input_mode: str = "test_case",
        user_story_content: str | None = None,
        user_story_filename: str | None = None,
        manual_urls: list[str] | None = None,
    ) -> Dict[str, Any]:
        with self._pipeline_lock:
            self.execution_logs = []
            start_time = datetime.now()
            pipeline_id = pipeline_id or str(uuid.uuid4())
            prompt_overrides = prompt_overrides or {}
            llm_overrides = llm_overrides or {}
            manual_urls = manual_urls or []

            try:
                _require_crawl4ai()
                session = self._create_session(
                    pipeline_id,
                    initial_input=test_case,
                    input_mode=input_mode,
                    user_story_content=user_story_content,
                    user_story_filename=user_story_filename,
                    manual_urls=manual_urls,
                    framework=framework,
                    language=language,
                    test_name=test_name,
                    headless=headless,
                    attempt=attempt,
                    prompt_overrides=prompt_overrides,
                    llm_overrides=llm_overrides,
                )

                self.push_event(
                    "PIPELINE_START",
                    "logs",
                    {
                        "pipeline_id": pipeline_id,
                        "test_name": test_name,
                        "framework": framework,
                        "language": language,
                        "attempt": attempt,
                        "timestamp": start_time.isoformat(),
                    },
                    pipeline_id,
                )

                self._set_session_state(pipeline_id, PipelineStage.STRUCTURING.value)
                self.push_event("STAGE_START", "structuring", {"stage": PipelineStage.STRUCTURING.value}, pipeline_id)
                struct_provider, struct_model, struct_api_key, struct_temperature = self._resolve_stage_llm("structuring", llm_overrides)
                structured = await StructuringStage(self.llm_provider, self.prompt_manager).execute(
                    test_case,
                    struct_api_key,
                    struct_model,
                    struct_provider,
                    temperature=struct_temperature,
                    input_mode=input_mode,
                    user_story_content=user_story_content,
                    user_story_filename=user_story_filename,
                    manual_urls=manual_urls,
                    prompt_override=prompt_overrides.get("structuring"),
                )
                self.push_event(
                    "STAGE_DONE",
                    "structuring",
                    {
                        "test_case": structured.testCase,
                        "modules": len(structured.modules),
                        "structured": structured.model_dump(),
                    },
                    pipeline_id,
                )

                browser_config = _create_browser_config(headless)
                extracted_test = structured.model_copy(deep=True)
                refined_test = structured.model_copy(deep=True)
                crawler_retry_errors: list[str] = []

                for crawler_attempt in range(2):
                    crawler = AsyncWebCrawler(config=browser_config)
                    try:
                        await crawler.start()
                        for idx, module in enumerate(structured.modules, 1):
                            module_start = datetime.now()
                            self._set_session_state(pipeline_id, PipelineStage.EXTRACTION.value)
                            self.push_event(
                                "MODULE_START",
                                "extraction",
                                {"index": idx, "total": len(structured.modules), "url": module.url},
                                pipeline_id,
                            )

                            extraction_provider, extraction_model, extraction_api_key, extraction_temperature = self._resolve_stage_llm("extraction", llm_overrides)
                            extracted_elements = await ExtractionStage(self.llm_provider, self.prompt_manager).execute(
                                crawler,
                                module,
                                extraction_api_key,
                                extraction_model,
                                extraction_provider,
                                temperature=extraction_temperature,
                                headless=headless,
                                prompt_override=prompt_overrides.get("extraction"),
                            )
                            extracted_test.modules[idx - 1].source_html = getattr(module, "source_html", None)
                            extracted_test.modules[idx - 1].extracted_data = extracted_elements
                            extracted_test.modules[idx - 1] = _map_extracted_data_to_steps(extracted_test.modules[idx - 1])
                            self.push_event(
                                "EXTRACTION_DONE",
                                "extraction",
                                {
                                    "index": idx,
                                    "total": len(structured.modules),
                                    "module": module.url,
                                    "elements_count": len(extracted_elements),
                                    "elements": _model_dump_list(extracted_elements),
                                    "extracted_snapshot": _sanitize_module_tree(extracted_test),
                                    "duration_ms": (datetime.now() - module_start).total_seconds() * 1000,
                                },
                                pipeline_id,
                            )

                            self._set_session_state(pipeline_id, PipelineStage.REFINEMENT.value)
                            refinement_provider, refinement_model, refinement_api_key, refinement_temperature = self._resolve_stage_llm("refinement", llm_overrides)
                            refined_test.modules[idx - 1].source_html = getattr(extracted_test.modules[idx - 1], "source_html", None)
                            refined_test.modules[idx - 1].extracted_data = extracted_elements
                            refined_elements = await RefinementStage(self.llm_provider, self.prompt_manager).execute(
                                None,
                                extracted_test.modules[idx - 1],
                                refinement_api_key,
                                refinement_model,
                                refinement_provider,
                                temperature=refinement_temperature,
                                headless=headless,
                                prompt_override=prompt_overrides.get("refinement"),
                            )
                            refined_test.modules[idx - 1].extracted_data = refined_elements
                            refined_test.modules[idx - 1] = _map_extracted_data_to_steps(refined_test.modules[idx - 1])
                            self.push_event(
                                "REFINEMENT_DONE",
                                "refinement",
                                {
                                    "index": idx,
                                    "total": len(structured.modules),
                                    "module": module.url,
                                    "elements_count": len(refined_elements),
                                    "elements": _model_dump_list(refined_elements),
                                    "refined_snapshot": _sanitize_module_tree(refined_test),
                                },
                                pipeline_id,
                            )
                        break
                    except Exception as exc:
                        crawler_retry_errors.append(str(exc))
                        exc_text = str(exc).lower()
                        if "browsertype.launch" in exc_text:
                            self.log(
                                "Crawl4AI browser launch failed. Verify the Render runtime, browser binaries, and Docker image.",
                                level="error",
                                stage="extraction",
                            )
                        if crawler_attempt == 0 and _is_crawl4ai_browser_lifecycle_error(exc):
                            self.log(
                                "Crawler lifecycle error detected. Recreating browser and retrying extraction once.",
                                level="warning",
                                stage="extraction",
                            )
                            continue
                        raise
                    finally:
                        try:
                            await crawler.close()
                        except Exception:
                            pass

                if crawler_retry_errors:
                    self.push_event("DEBUG", "logs", {"crawler_retry_errors": crawler_retry_errors[-2:]}, pipeline_id)

                self._set_session_state(pipeline_id, PipelineStage.GENERATION.value)
                self.push_event("STAGE_START", "generation", {"stage": PipelineStage.GENERATION.value}, pipeline_id)
                generation_provider, generation_model, generation_api_key, generation_temperature = self._resolve_stage_llm("generation", llm_overrides)
                script = await GenerationStage(self.llm_provider, self.prompt_manager).execute(
                    refined_test,
                    framework,
                    language,
                    generation_api_key,
                    generation_model,
                    generation_provider,
                    temperature=generation_temperature,
                    prompt_override=prompt_overrides.get("generation"),
                )
                self.push_event(
                    "STAGE_DONE",
                    "generation",
                    {"script_length": len(script), "script_preview": script[:500], "script": script},
                    pipeline_id,
                )

                self._set_session_state(pipeline_id, PipelineStage.VALIDATION.value)
                self.push_event("STAGE_START", "validation", {"stage": PipelineStage.VALIDATION.value}, pipeline_id)
                validation_provider, validation_model, validation_api_key, validation_temperature = self._resolve_stage_llm("validation", llm_overrides)
                validation = await ValidationStage(self.llm_provider, self.prompt_manager).execute(
                    script,
                    refined_test,
                    validation_api_key,
                    validation_model,
                    validation_provider,
                    temperature=validation_temperature,
                    prompt_override=prompt_overrides.get("validation"),
                )
                self.push_event("STAGE_DONE", "validation", {"validation": validation, "generated_script": script}, pipeline_id)

                session["data"].update(
                    {
                        "structured": structured.model_dump(),
                        "extracted": _sanitize_module_tree(extracted_test),
                        "refined": _sanitize_module_tree(refined_test),
                        "script": script,
                        "validation": validation,
                        "test_case": test_case,
                        "input_mode": input_mode,
                        "user_story_content": user_story_content,
                        "user_story_filename": user_story_filename,
                        "manual_urls": manual_urls,
                        "framework": framework,
                        "language": language,
                        "test_name": test_name,
                        "headless": headless,
                        "attempt": attempt,
                        "pipeline_id": pipeline_id,
                        "prompt_overrides": prompt_overrides,
                        "llm_overrides": llm_overrides,
                    }
                )
                session["state"] = "WAITING_VALIDATION"
                session["paused_at"] = PipelineStage.VALIDATION.value
                session["updated_at"] = _iso_now()
                self.push_event(
                    "PIPELINE_PAUSED",
                    "logs",
                    {"pipeline_id": pipeline_id, "paused_at": PipelineStage.VALIDATION.value},
                    pipeline_id,
                )
                session["queue"].put(None)

                return {
                    "status": "waiting_validation",
                    "pipeline_id": pipeline_id,
                    "structured": structured.model_dump(),
                    "extracted": _sanitize_module_tree(extracted_test),
                    "refined": _sanitize_module_tree(refined_test),
                    "script": script,
                    "validation": validation,
                    "variables": validation.get("detected_inputs", []),
                    "editable_fields": validation.get("editable_fields", []),
                    "logs": self.execution_logs,
                    "llm_overrides": llm_overrides,
                }
            except Exception as exc:
                self.push_event("PIPELINE_ERROR", "logs", {"error": str(exc), "traceback": traceback.format_exc()}, pipeline_id)
                session = self._get_session(pipeline_id)
                if session:
                    session["state"] = "ERROR"
                    session["data"]["error"] = str(exc)
                    session["paused_at"] = "ERROR"
                    session["queue"].put(None)
                return {"status": "error", "error": str(exc), "pipeline_id": pipeline_id, "logs": self.execution_logs}

    # async def run_full_pipeline_1(
    #     self,
    #     test_case: str,
    #     framework: str,
    #     language: str,
    #     test_name: str | None = None,
    #     headless: bool = True,
    #     attempt: int = 1,
    #     pipeline_id: str | None = None,
    #     prompt_overrides: Dict[str, str] | None = None,
    #     llm_overrides: Dict[str, Any] | None = None,
    #     input_mode: str = "test_case",
    #     user_story_content: str | None = None,
    #     user_story_filename: str | None = None,
    #     manual_urls: list[str] | None = None,
    # ) -> Dict[str, Any]:
    #     with self._pipeline_lock:
    #         self.execution_logs = []
    #         start_time = datetime.now()
    #         pipeline_id = pipeline_id or str(uuid.uuid4())

    #         try:
    #             _require_crawl4ai()
    #             session = self._create_session(
    #                 pipeline_id,
    #                 initial_input=test_case,
    #                 input_mode=input_mode,
    #                 user_story_content=user_story_content,
    #                 user_story_filename=user_story_filename,
    #                 manual_urls=manual_urls or [],
    #                 framework=framework,
    #                 language=language,
    #                 test_name=test_name,
    #                 headless=headless,
    #                 attempt=attempt,
    #                 prompt_overrides=prompt_overrides or {},
    #                 llm_overrides=llm_overrides or {},
    #             )

    #             self.push_event(
    #                 "PIPELINE_START",
    #                 "logs",
    #                 {
    #                     "pipeline_id": pipeline_id,
    #                     "test_name": test_name,
    #                     "framework": framework,
    #                     "language": language,
    #                     "attempt": attempt,
    #                     "timestamp": start_time.isoformat(),
    #                 },
    #                 pipeline_id,
    #             )

    #             self._set_session_state(pipeline_id, PipelineStage.STRUCTURING.value)
    #             self.push_event("STAGE_START", "structuring", {"stage": PipelineStage.STRUCTURING.value}, pipeline_id)
    #             struct_provider, struct_model, struct_api_key, struct_temperature = self._resolve_stage_llm("structuring", llm_overrides)
    #             structured = await StructuringStage(self.llm_provider, self.prompt_manager).execute(
    #                 test_case,
    #                 struct_api_key,
    #                 struct_model,
    #                 struct_provider,
    #                 temperature=struct_temperature,
    #                 input_mode=input_mode,
    #                 user_story_content=user_story_content,
    #                 user_story_filename=user_story_filename,
    #                 manual_urls=manual_urls or [],
    #                 prompt_override=(prompt_overrides or {}).get("structuring"),
    #             )
    #             self.push_event(
    #                 "STAGE_DONE",
    #                 "structuring",
    #                 {
    #                     "test_case": structured.testCase,
    #                     "modules": len(structured.modules),
    #                     "structured": structured.model_dump(),
    #                 },
    #                 pipeline_id,
    #             )

    #             browser_config = _create_browser_config(headless)
    #             crawler_retry_errors: list[str] = []
    #             for crawler_attempt in range(2):
    #                 extracted_test = structured.model_copy(deep=True)
    #                 refined_test = structured.model_copy(deep=True)
    #                 crawler = AsyncWebCrawler(config=browser_config, thread_safe=True)
    #                 try:
    #                     await crawler.start()
    #                     for idx, module in enumerate(structured.modules, 1):
    #                         module_start = datetime.now()
    #                         self._set_session_state(pipeline_id, PipelineStage.EXTRACTION.value)
    #                         self.push_event(
    #                             "MODULE_START",
    #                             "extraction",
    #                             {"index": idx, "total": len(structured.modules), "url": module.url},
    #                             pipeline_id,
    #                         )

    #                         extraction_provider, extraction_model, extraction_api_key, extraction_temperature = self._resolve_stage_llm("extraction", llm_overrides)
    #                         extracted_elements = await ExtractionStage(self.llm_provider, self.prompt_manager).execute(
    #                             crawler,
    #                             module,
    #                             extraction_api_key,
    #                             extraction_model,
    #                             extraction_provider,
    #                             temperature=extraction_temperature,
    #                             headless=headless,
    #                             prompt_override=(prompt_overrides or {}).get("extraction"),
    #                         )
    #                         extracted_test.modules[idx - 1].source_html = getattr(module, "source_html", None)
    #                         extracted_test.modules[idx - 1].extracted_data = extracted_elements
    #                         extracted_test.modules[idx - 1] = _map_extracted_data_to_steps(extracted_test.modules[idx - 1])
    #                         self.push_event(
    #                             "EXTRACTION_DONE",
    #                             "extraction",
    #                             {
    #                                 "index": idx,
    #                                 "total": len(structured.modules),
    #                                 "module": module.url,
    #                                 "elements_count": len(extracted_elements),
    #                                 "elements": _model_dump_list(extracted_elements),
    #                                 "extracted_snapshot": _sanitize_module_tree(extracted_test),
    #                                 "duration_ms": (datetime.now() - module_start).total_seconds() * 1000,
    #                             },
    #                             pipeline_id,
    #                         )

    #                         self._set_session_state(pipeline_id, PipelineStage.REFINEMENT.value)
    #                         refinement_provider, refinement_model, refinement_api_key, refinement_temperature = self._resolve_stage_llm("refinement", llm_overrides)
    #                         refined_test.modules[idx - 1].source_html = getattr(extracted_test.modules[idx - 1], "source_html", None)
    #                         refined_test.modules[idx - 1].extracted_data = extracted_elements
    #                         refined_elements = await RefinementStage(self.llm_provider, self.prompt_manager).execute(
    #                             None,
    #                             extracted_test.modules[idx - 1],
    #                             refinement_api_key,
    #                             refinement_model,
    #                             refinement_provider,
    #                             temperature=refinement_temperature,
    #                             headless=headless,
    #                             prompt_override=(prompt_overrides or {}).get("refinement"),
    #                         )
    #                         refined_test.modules[idx - 1].extracted_data = refined_elements
    #                         refined_test.modules[idx - 1] = _map_extracted_data_to_steps(refined_test.modules[idx - 1])
    #                         self.push_event(
    #                             "REFINEMENT_DONE",
    #                             "refinement",
    #                             {
    #                                 "index": idx,
    #                                 "total": len(structured.modules),
    #                                 "module": module.url,
    #                                 "elements_count": len(refined_elements),
    #                                 "elements": _model_dump_list(refined_elements),
    #                                 "refined_snapshot": _sanitize_module_tree(refined_test),
    #                             },
    #                             pipeline_id,
    #                         )
    #                     break
    #                 except Exception as exc:
    #                     crawler_retry_errors.append(str(exc))
    #                     if crawler_attempt == 0 and _is_crawl4ai_browser_lifecycle_error(exc):
    #                         self.log("Crawler lifecycle error detected. Recreating browser and retrying extraction once.", level="warning", stage="extraction")
    #                         continue
    #                     raise
    #                 finally:
    #                     try:
    #                         await crawler.close()
    #                     except Exception:
    #                         pass
    #             if crawler_retry_errors:
    #                 self.push_event(
    #                     "DEBUG",
    #                     "logs",
    #                     {"crawler_retry_errors": crawler_retry_errors[-2:]},
    #                     pipeline_id,
    #                 )

    #             self._set_session_state(pipeline_id, PipelineStage.GENERATION.value)
    #             self.push_event("STAGE_START", "generation", {"stage": PipelineStage.GENERATION.value}, pipeline_id)
    #             generation_provider, generation_model, generation_api_key, generation_temperature = self._resolve_stage_llm("generation", llm_overrides)
    #             script = await GenerationStage(self.llm_provider, self.prompt_manager).execute(
    #                 refined_test,
    #                 framework,
    #                 language,
    #                 generation_api_key,
    #                 generation_model,
    #                 generation_provider,
    #                 temperature=generation_temperature,
    #                 prompt_override=(prompt_overrides or {}).get("generation"),
    #             )
    #             self.push_event(
    #                 "STAGE_DONE",
    #                 "generation",
    #                 {"script_length": len(script), "script_preview": script[:500], "script": script},
    #                 pipeline_id,
    #             )

    #             self._set_session_state(pipeline_id, PipelineStage.VALIDATION.value)
    #             self.push_event("STAGE_START", "validation", {"stage": PipelineStage.VALIDATION.value}, pipeline_id)
    #             validation_provider, validation_model, validation_api_key, validation_temperature = self._resolve_stage_llm("validation", llm_overrides)
    #             validation = await ValidationStage(self.llm_provider, self.prompt_manager).execute(
    #                 script,
    #                 refined_test,
    #                 validation_api_key,
    #                 validation_model,
    #                 validation_provider,
    #                 temperature=validation_temperature,
    #                 prompt_override=(prompt_overrides or {}).get("validation"),
    #             )
    #             self.push_event(
    #                 "STAGE_DONE",
    #                 "validation",
    #                 {
    #                     "validation": validation,
    #                     "detected_inputs": validation.get("detected_inputs", []),
    #                     "editable_fields": validation.get("editable_fields", []),
    #                     "generated_script": script,
    #                 },
    #                 pipeline_id,
    #             )

    #             session["data"].update(
    #                 {
    #                     "structured": structured.model_dump(),
    #                     "extracted": _sanitize_module_tree(extracted_test),
    #                     "refined": _sanitize_module_tree(refined_test),
    #                     "script": script,
    #                     "validation": validation,
    #                     "test_case": test_case,
    #                     "input_mode": input_mode,
    #                     "user_story_content": user_story_content,
    #                     "user_story_filename": user_story_filename,
    #                     "manual_urls": manual_urls or [],
    #                     "framework": framework,
    #                     "language": language,
    #                     "test_name": test_name,
    #                     "headless": headless,
    #                     "attempt": attempt,
    #                     "pipeline_id": pipeline_id,
    #                     "prompt_overrides": prompt_overrides or {},
    #                     "llm_overrides": llm_overrides or {},
    #                 }
    #             )
    #             session["state"] = "WAITING_VALIDATION"
    #             session["paused_at"] = PipelineStage.VALIDATION.value
    #             session["updated_at"] = _iso_now()
    #             self.push_event(
    #                 "PIPELINE_PAUSED",
    #                 "logs",
    #                 {
    #                     "pipeline_id": pipeline_id,
    #                     "paused_at": PipelineStage.VALIDATION.value,
    #                 },
    #                 pipeline_id,
    #             )

    #             return {
    #                 "status": "waiting_validation",
    #                 "pipeline_id": pipeline_id,
    #                 "structured": structured.model_dump(),
    #                 "extracted": _sanitize_module_tree(extracted_test),
    #                 "refined": _sanitize_module_tree(refined_test),
    #                 "script": script,
    #                 "validation": validation,
    #                 "variables": validation.get("detected_inputs", []),
    #                 "editable_fields": validation.get("editable_fields", []),
    #                 "logs": self.execution_logs,
    #                 "llm_overrides": llm_overrides or {},
    #             }
    #         except Exception as exc:
    #             self.push_event("PIPELINE_ERROR", "logs", {"error": str(exc), "traceback": traceback.format_exc()}, pipeline_id)
    #             session = self._get_session(pipeline_id)
    #             if session:
    #                 session["state"] = "ERROR"
    #                 session["data"]["error"] = str(exc)
    #                 session["paused_at"] = "ERROR"
    #                 session["queue"].put(None)
    #             return {"status": "error", "error": str(exc), "pipeline_id": pipeline_id, "logs": self.execution_logs}
    

    async def run_full_pipeline_2(
        self,
        pipeline_id: str,
        manual_changes: Dict[str, Any] | None = None,
        continue_without_changes: bool = True,
        resume_from_stage: str | None = None,
        script_override: str | None = None,
        prompt_overrides: Dict[str, str] | None = None,
        llm_overrides: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        with self._pipeline_lock:
            session = self._get_session(pipeline_id)
            if not session:
                self.push_event("PIPELINE_ERROR", "logs", {"error": "Pipeline session not found", "pipeline_id": pipeline_id})
                raise ValueError("Pipeline session not found")

            try:
                self.push_event("PIPELINE_RESUME", "logs", {"pipeline_id": pipeline_id}, pipeline_id)
                manual_changes = _normalize_manual_changes(manual_changes)
                prompt_overrides = prompt_overrides or session["data"].get("prompt_overrides", {}) or {}
                llm_overrides = llm_overrides or session["data"].get("llm_overrides", {}) or {}
                refined = session["data"].get("refined")
                original_script = script_override or session["data"].get("script", "")
                framework = session["data"].get("framework")
                language = session["data"].get("language")
                validation = session["data"].get("validation", {})

                confirmed_script = original_script
                confirmation_used_llm = False

                if resume_from_stage == "confirmation" and manual_changes and not continue_without_changes:
                    self._set_session_state(pipeline_id, PipelineStage.CONFIRMATION.value)
                    self.push_event("STAGE_START", "confirmation", manual_changes, pipeline_id)
                    confirmation_provider, confirmation_model, confirmation_api_key, confirmation_temperature = self._resolve_stage_llm("confirmation", llm_overrides)
                    confirmed_script = await self.run_confirmation(
                        original_script,
                        manual_changes,
                        temperature=confirmation_temperature,
                        prompt_override=prompt_overrides.get("confirmation"),
                        llm_override={"provider": confirmation_provider, "model": confirmation_model, "api_key": confirmation_api_key},
                    )
                    confirmation_used_llm = True
                    self.push_event(
                        "STAGE_DONE",
                        "confirmation",
                        {
                            "script_updated": True,
                            "confirmed_script": confirmed_script,
                            "script_preview": confirmed_script[:500],
                        },
                        pipeline_id,
                    )
                else:
                    self.push_event(
                        "STAGE_DONE",
                        "confirmation",
                        {
                            "script_updated": False,
                            "script_reused": True,
                            "confirmed_script": confirmed_script,
                            "script_preview": confirmed_script[:500],
                        },
                        pipeline_id,
                    )

                session["data"]["manual_changes"] = manual_changes
                session["data"]["confirmed_script"] = confirmed_script
                session["data"]["confirmation_used_llm"] = confirmation_used_llm

                self._set_session_state(pipeline_id, PipelineStage.EXECUTION.value)
                self.push_event("STAGE_START", "execution", {"framework": framework, "language": language}, pipeline_id)
                execution_result = await self.run_execution(
                    confirmed_script,
                    framework,
                    language,
                    log_callback=lambda level, message: self.push_event(
                        "EXECUTION_LOG",
                        "execution",
                        {"level": level, "message": message},
                        pipeline_id,
                    ),
                )
                execution_artifacts = _compact_execution_artifacts(execution_result)
                self.push_event(
                    "STAGE_DONE",
                    "execution",
                    {
                        **_model_dump(execution_result),
                        "execution_artifacts": execution_artifacts,
                        "primary_screenshot": execution_artifacts.get("primary_screenshot"),
                    },
                    pipeline_id,
                )

                self._set_session_state(pipeline_id, PipelineStage.HOMOLOGATION.value)
                self.push_event("STAGE_START", "homologation", {}, pipeline_id)
                homologation_provider, homologation_model, homologation_api_key, homologation_temperature = self._resolve_stage_llm("homologation", llm_overrides)
                homologation = await self.run_homologation(
                    execution_result,
                    refined,
                    validation,
                    manual_changes,
                    confirmed_script,
                    temperature=homologation_temperature,
                    prompt_override=prompt_overrides.get("homologation"),
                    llm_override={"provider": homologation_provider, "model": homologation_model, "api_key": homologation_api_key},
                )
                self.push_event("STAGE_DONE", "homologation", homologation, pipeline_id)

                finalization_input = {
                    "pipeline_id": pipeline_id,
                    "inputs": {
                        "initial_input": session["data"].get("initial_input"),
                        "test_case": session["data"].get("test_case"),
                        "framework": framework,
                        "language": language,
                        "test_name": session["data"].get("test_name"),
                        "manual_changes": manual_changes,
                        "validation": {
                            "detected_inputs": _compact_sequence(validation.get("detected_inputs", []), 15),
                            "editable_fields": _compact_sequence(validation.get("editable_fields", []), 15),
                        },
                    },
                    "history": _compact_history_entries(session["history"], 25),
                    "timeline": _compact_timeline_entries(session["timeline"], 30),
                    "structured": _sanitize_module_tree(session["data"].get("structured") or {}),
                    "extracted": _sanitize_module_tree(session["data"].get("extracted") or {}),
                    "refined": _sanitize_module_tree(refined or {}),
                    "script": {
                        "original": _truncate_text(original_script, 5000),
                        "confirmed": _truncate_text(confirmed_script, 5000),
                    },
                    "execution": _compact_execution_result(execution_result),
                    "execution_artifacts": execution_artifacts,
                    "homologation": {
                        key: _truncate_text(value, 2500)
                        for key, value in (homologation or {}).items()
                    }
                    if isinstance(homologation, dict)
                    else _truncate_text(str(homologation), 2500),
                    "logs": _compact_log_entries(self.execution_logs, 80, 300),
                    "prompts_used": [
                        "structuring",
                        "extraction",
                        "refinement",
                        "generation",
                        "validation",
                        "confirmation",
                        "execution",
                        "homologation",
                        "finalization",
                        "refactoring",
                    ],
                }

                self._set_session_state(pipeline_id, PipelineStage.FINALIZATION.value)
                self.push_event("STAGE_START", "finalization", {}, pipeline_id)
                finalization_provider, finalization_model, finalization_api_key, finalization_temperature = self._resolve_stage_llm("finalization", llm_overrides)
                final_report = await self.run_finalization(
                    finalization_input,
                    temperature=finalization_temperature,
                    prompt_override=prompt_overrides.get("finalization"),
                    llm_override={"provider": finalization_provider, "model": finalization_model, "api_key": finalization_api_key},
                )
                self.push_event("STAGE_DONE", "finalization", final_report, pipeline_id)

                self._set_session_state(pipeline_id, PipelineStage.REFACTORING.value)
                self.push_event("STAGE_START", "refactoring", {}, pipeline_id)
                refactoring_provider, refactoring_model, refactoring_api_key, refactoring_temperature = self._resolve_stage_llm("refactoring", llm_overrides)
                refactoring = await self.run_refactoring(
                    confirmed_script,
                    execution_result,
                    homologation,
                    final_report,
                    temperature=refactoring_temperature,
                    prompt_override=prompt_overrides.get("refactoring"),
                    llm_override={"provider": refactoring_provider, "model": refactoring_model, "api_key": refactoring_api_key},
                )

                if not isinstance(refactoring, dict):
                    refactoring = {"refactored_script": str(refactoring)}

                refactored_script = refactoring.get("refactored_script") or refactoring.get("script") or ""
                if not refactored_script:
                    refactored_script = confirmed_script

                refactoring.setdefault("original_script", original_script)
                refactoring.setdefault("refactored_script", refactored_script)
                refactoring.setdefault("diff", "")
                refactoring.setdefault("justification", "")

                self.push_event("STAGE_DONE", "refactoring", refactoring, pipeline_id)

                exportables = {
                    "json": final_report,
                    "html": _build_execution_report_html(final_report),
                    "markdown": _build_execution_report_markdown(final_report),
                }

                session["data"].update(
                    {
                        "manual_changes": manual_changes,
                        "confirmed_script": confirmed_script,
                        "execution_result": _model_dump(execution_result),
                        "homologation": homologation,
                        "final_report": final_report,
                        "refactoring": refactoring,
                        "refactored_script": refactored_script,
                        "exportables": exportables,
                        "state": "COMPLETED",
                        "prompt_overrides": prompt_overrides,
                        "llm_overrides": llm_overrides,
                    }
                )
                session["state"] = "COMPLETED"
                session["updated_at"] = _iso_now()
                self.push_event("PIPELINE_COMPLETED", "logs", {"pipeline_id": pipeline_id}, pipeline_id)
                session["queue"].put(None)

                return {
                    "status": "completed",
                    "pipeline_id": pipeline_id,
                    "execution": _model_dump(execution_result),
                    "homologation": homologation,
                    "final_report": final_report,
                    "exportables": exportables,
                    "refactoring": refactoring,
                    "refactored_script": refactored_script,
                    "confirmed_script": confirmed_script,
                    "manual_changes": manual_changes,
                    "confirmation_used_llm": confirmation_used_llm,
                    "resume_from_stage": resume_from_stage or "confirmation",
                    "logs": self.execution_logs,
                    "llm_overrides": llm_overrides,
                }
            except Exception as exc:
                self.push_event("PIPELINE_ERROR", "logs", {"error": str(exc), "traceback": traceback.format_exc()}, pipeline_id)
                session = self._get_session(pipeline_id)
                if session:
                    session["state"] = "ERROR"
                    session["data"]["error"] = str(exc)
                    session["paused_at"] = "ERROR"
                    session["queue"].put(None)
                return {"status": "error", "error": str(exc), "pipeline_id": pipeline_id, "logs": self.execution_logs}


async def validate_llm_connection(provider: str, model: str, api_key: str) -> bool:
    return LLMFactory.validate_connection(provider, model, api_key)


def map_extracted_data_to_steps(module: Module):
    return _map_extracted_data_to_steps(module)
