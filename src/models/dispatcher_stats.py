"""Model for crawler dispatcher performance statistics."""

from typing import Optional

from pydantic import BaseModel, Field


class DispatcherStatsModel(BaseModel):
    """Performance metrics collected from the memory-adaptive dispatcher."""

    memory_usage_MB: float = Field(default=0.0, description="Memory used during the crawl in MB.")
    peak_memory_MB: float = Field(default=0.0, description="Peak memory usage during the crawl in MB.")
    start_time: Optional[str] = Field(default=None, description="ISO-8601 timestamp when the crawl started.")
    end_time: Optional[str] = Field(default=None, description="ISO-8601 timestamp when the crawl ended.")
    duration_seconds: float = Field(default=0.0, description="Wall-clock duration of the crawl in seconds.")
