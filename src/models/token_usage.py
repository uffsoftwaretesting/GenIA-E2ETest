"""Model for LLM token usage statistics."""

from pydantic import BaseModel, Field


class TokenUsageModel(BaseModel):
    """Aggregated token consumption for a single LLM call."""

    completion_tokens: int = Field(default=0, description="Tokens used in the completion.")
    prompt_tokens: int = Field(default=0, description="Tokens used in the prompt.")
    total_tokens: int = Field(default=0, description="Total tokens consumed.")
