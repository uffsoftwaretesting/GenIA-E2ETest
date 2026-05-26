"""Framework catalog and helpers."""

from __future__ import annotations

from typing import Dict, List


FRAMEWORK_LANGUAGES: Dict[str, List[str]] = {
    "robotframework": ["python"],
    "playwright": ["javascript", "typescript"],
    "cypress": ["javascript", "typescript"],
    "pytest": ["python"],
    "junit": ["java"],
    "selenium": ["python", "javascript", "typescript", "java"],
}


def get_framework_languages(framework: str) -> List[str]:
    return FRAMEWORK_LANGUAGES.get(framework, [])


def get_available_frameworks() -> List[str]:
    return list(FRAMEWORK_LANGUAGES.keys())
