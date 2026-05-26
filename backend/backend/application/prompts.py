"""Prompt loading and caching."""

from __future__ import annotations

from pathlib import Path


class PromptManager:
    def __init__(self, prompts_dir: str = "prompts"):
        self.prompts_dir = Path(prompts_dir)
        self._prompts_cache: dict[str, str] = {}

    def load_prompt(self, stage: str) -> str:
        if stage in self._prompts_cache:
            return self._prompts_cache[stage]

        prompt_map = {
            "structuring": "structuring.txt",
            "structuring_user_history": "structuring_user_history.txt",
            "extraction": "extraction.txt",
            "refinement": "refinement.txt",
            "validation": "validation.txt",
            "confirmation": "confirmation.txt",
            "execution": "execution.txt",
            "homologation": "homologation.txt",
            "finalization": "finalization.txt",
            "refactoring": "refactoring.txt",
        }

        if stage not in prompt_map:
            raise ValueError(f"Unknown pipeline stage: {stage}")

        prompt_file = self.prompts_dir / prompt_map[stage]
        if not prompt_file.exists():
            raise FileNotFoundError(f"Prompt file not found: {prompt_file}")

        content = prompt_file.read_text(encoding="utf-8")
        self._prompts_cache[stage] = content
        return content

    def load_generation_prompt(self, framework: str) -> str:
        framework_map = {
            "robotframework": "robot_framework.txt",
            "cypress": "cypress.txt",
            "playwright": "playwright.txt",
            "pytest": "pytest.txt",
            "junit": "junit.txt",
            "selenium": "selenium.txt",
        }

        if framework not in framework_map:
            raise ValueError(f"Unknown framework: {framework}")

        prompt_file = self.prompts_dir / "generation" / framework_map[framework]
        if not prompt_file.exists():
            raise FileNotFoundError(f"Framework prompt not found: {prompt_file}")

        return prompt_file.read_text(encoding="utf-8")

    def load_prompt_bundle(self, framework: str | None = None, input_mode: str | None = None) -> dict[str, str]:
        structuring_key = "structuring_user_history" if input_mode == "user_story" else "structuring"
        bundle = {
            "structuring": self.load_prompt(structuring_key),
            "extraction": self.load_prompt("extraction"),
            "refinement": self.load_prompt("refinement"),
            "validation": self.load_prompt("validation"),
            "confirmation": self.load_prompt("confirmation"),
            "homologation": self.load_prompt("homologation"),
            "finalization": self.load_prompt("finalization"),
            "refactoring": self.load_prompt("refactoring"),
        }

        if input_mode == "user_story":
            bundle["structuring_user_history"] = self.load_prompt("structuring_user_history")

        if framework:
            bundle["generation"] = self.load_generation_prompt(framework)

        return bundle
