"""Factory and adapter layer for LLM providers."""

from __future__ import annotations

import importlib
import logging


logger = logging.getLogger(__name__)


class LLMFactory:
    _providers = {
        "openai": "llms.openai:OpenAIProvider",
        "anthropic": "llms.anthropic:AnthropicProvider",
        "gemini": "llms.gemini:GeminiProvider",
        "cohere": "llms.cohere:CohereProvider",
    }

    @classmethod
    def get_provider(cls, provider_name: str):
        if provider_name not in cls._providers:
            raise ValueError(f"Unknown LLM provider: {provider_name}")
        module_path, class_name = cls._providers[provider_name].split(":", 1)
        module = importlib.import_module(module_path)
        provider_cls = getattr(module, class_name)
        return provider_cls()

    @classmethod
    def validate_connection(cls, provider: str, model: str, api_key: str) -> bool:
        try:
            llm = cls.get_provider(provider)
            llm.validate_connection(api_key, model)
            return True
        except Exception as exc:
            logger.error("LLM validation failed: %s", exc)
            return False
