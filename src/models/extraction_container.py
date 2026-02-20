"""Container model for a batch of extracted HTML elements."""

from typing import List

from pydantic import BaseModel, Field

from src.models.extracted_element import ExtractedElement


class ExtractionContainer(BaseModel):
    """Wrapper that groups all extracted elements from a single page."""

    elements: List[ExtractedElement] = Field(
        description="List of all extracted HTML elements found on the page matching the criteria.",
    )
