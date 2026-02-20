"""Model representing a complete test case."""

from typing import List

from pydantic import BaseModel, Field

from src.models.module import ModuleModel


class TestCaseModel(BaseModel):
    """A complete test case composed of one or more URL-scoped modules."""

    testCase: str = Field(
        ...,
        description="Test case name.",
    )
    modules: List[ModuleModel] = Field(
        ...,
        description="A list of modules representing separate URLs involved in the test case.",
    )
