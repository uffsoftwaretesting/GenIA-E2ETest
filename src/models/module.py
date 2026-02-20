"""Model representing a test module scoped to a specific URL."""

from typing import List

from pydantic import BaseModel, Field

from src.models.execution_step import ExecutionStepModel


class ModuleModel(BaseModel):
    """A test module corresponding to a specific URL in the test case."""

    url: str = Field(
        ...,
        description=(
            "The specific URL where this portion of the test case is executed. "
            "Must include protocol (e.g., 'https://')."
        ),
    )
    purpose: str = Field(
        ...,
        description="A brief and clear description of the main objective for this URL in the test case.",
    )
    execution_steps: List[ExecutionStepModel] = Field(
        ...,
        description="A list of step objects that detail user actions and extracted elements on this page.",
    )
