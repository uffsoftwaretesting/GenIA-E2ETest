"""Extended test case model that includes extraction metadata per module."""

from typing import List

from pydantic import Field

from src.models.extracted_module_model import ExtractedModuleModel
from src.models.test_case import TestCaseModel


class ExtractedTestCaseModel(TestCaseModel):
    """A test case whose modules carry extraction token/dispatcher metadata."""

    modules: List[ExtractedModuleModel] = Field(
        ...,
        description="Modules enriched with extraction metadata.",
    )
