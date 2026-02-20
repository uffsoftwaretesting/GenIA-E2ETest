"""Extended module model carrying LLM extraction metadata."""

from typing import Optional

from src.models.dispatcher_stats import DispatcherStatsModel
from src.models.module import ModuleModel
from src.models.token_usage import TokenUsageModel


class ExtractedModuleModel(ModuleModel):
    """A module augmented with token usage and dispatcher statistics from extraction."""

    token: Optional[TokenUsageModel] = None
    dispatcher: Optional[DispatcherStatsModel] = None
