"""Model representing a single execution step in a test case."""

from typing import List

from pydantic import BaseModel, Field

from src.models.extracted_element import ExtractedElement


class ExecutionStepModel(BaseModel):
    """A user action or verification performed on a page."""

    step: str = Field(
        ...,
        description="A description of the user action or verification performed on this page.",
    )
    extracted_data: List[ExtractedElement] = Field(
        default_factory=list,
        description="List of HTML elements involved in this step. Can be empty if not applicable.",
    )
