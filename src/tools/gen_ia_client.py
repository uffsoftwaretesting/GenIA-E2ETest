"""Singleton OpenAI client provider."""

from typing import Optional

import openai
from openai import Client

from src.env import env_variables

type GenIAClient = Client

class GenIAClientProvider:
    """Provides a single shared OpenAI client instance across the application."""

    _client: Optional[GenIAClient] = None

    @classmethod
    def get_client(cls) -> GenIAClient:
        """Return the shared OpenAI client, creating it on first call.

        Returns:
            The shared ``openai.OpenAI`` client instance.
        """
        if cls._client is None:
            cls._client = openai.OpenAI(api_key=env_variables.api_key_string)

        return cls._client
  
