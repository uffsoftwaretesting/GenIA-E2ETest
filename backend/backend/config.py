"""Centralized configuration for the backend."""

from dataclasses import dataclass, field
import os


@dataclass(slots=True)
class BackendConfig:
    prompts_dir: str = field(default_factory=lambda: os.getenv("GENIA_PROMPTS_DIR", "prompts"))
    test_cases_dir: str = field(default_factory=lambda: os.getenv("GENIA_TEST_CASES_DIR", "TestCases"))
    api_host: str = field(default_factory=lambda: os.getenv("GENIA_HOST", "0.0.0.0"))
    api_port: int = field(default_factory=lambda: int(os.getenv("GENIA_PORT", "5000")))
    max_upload_size_mb: int = field(default_factory=lambda: int(os.getenv("GENIA_MAX_UPLOAD_SIZE_MB", "100")))


def get_settings() -> BackendConfig:
    return BackendConfig()

