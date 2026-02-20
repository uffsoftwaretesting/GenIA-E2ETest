"""Parsing and data-mapping utilities for extraction results."""

from typing import List

from src.models.extracted_element import ExtractedElement
from src.models.extracted_module_model import ExtractedModuleModel
from src.utils.logger import get_logger

logger = get_logger(__name__)


def strip_markdown_code_fences(text: str) -> str:
    """Remove leading and trailing Markdown code fences from *text*.

    Args:
        text: Raw text that may be wrapped in triple-backtick fences.

    Returns:
        The text with code fences stripped, or the original text if none were found.
    """
    if not text.startswith("``"):
        return text

    lines = text.split("\n")
    if lines and lines[0].startswith("``"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "``":
        lines = lines[:-1]

    cleaned = "\n".join(lines)
    logger.debug("Stripped Markdown code fences from text")
    return cleaned


def map_extracted_data_to_steps(
    module_model: ExtractedModuleModel,
    extracted_elements: List[ExtractedElement],
) -> ExtractedModuleModel:
    """Assign each extracted element to its corresponding execution step.

    Elements are matched by comparing `ExtractedElement.step_name` with
    `ExecutionStepModel.step`.

    Args:
        module_model: The module whose steps will be populated.
        extracted_elements: Elements returned by the LLM extraction.

    Returns:
        The same *module_model* instance with `extracted_data` populated on each step.
    """
    matched_count = 0

    for step in module_model.execution_steps:
        step_elements = [
            el for el in extracted_elements
            if el.step_name == step.step
        ]

        if step_elements:
            step.extracted_data = step_elements
            matched_count += len(step_elements)

    logger.debug(f"Mapped {matched_count} extracted elements to steps in module {module_model.url}")

    return module_model
