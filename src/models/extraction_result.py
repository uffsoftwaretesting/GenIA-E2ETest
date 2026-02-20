"""Model for the structured result of an LLM-based element extraction."""

from typing import List

from pydantic import BaseModel, Field

from src.models.dispatcher_stats import DispatcherStatsModel
from src.models.extracted_element import ExtractedElement
from src.models.token_usage import TokenUsageModel


class ExtractionResultModel(BaseModel):
    """Aggregated output of a single extraction or refinement pass."""

    extracted_content: List[ExtractedElement] = Field(
        ..., description="HTML elements extracted by the LLM.",
    )
    token_usage: TokenUsageModel = Field(
        ..., description="Token consumption statistics for the extraction call.",
    )
    dispatcher_data: DispatcherStatsModel = Field(
        ..., description="Dispatcher performance metrics for the crawl.",
    )
