"""Shared state definition for the LangGraph E2E test generation workflow."""

from typing import Annotated, List, Optional, TypedDict

from langgraph.graph.message import BaseMessage, add_messages

from src.models.extracted_test_case_model import ExtractedTestCaseModel
from src.models.test_case import TestCaseModel
from src.utils.enums import GenIAStateStatus


class GenIAState(TypedDict):
    """Main state shared across all nodes in the LangGraph workflow.

    Attributes:
        messages: Conversation messages exchanged between agents.
        execution_status: Current phase of the workflow.
        attempt_number: Retry attempt number for the current test case.
        test_case: Raw text of the input test case.
        test_case_name: Identifier derived from the input file name.
        output_directory: Folder path for generated artifacts.
        current_module_index: Index of the module being processed.
        refined_test_case: Structured test case after Level 1 restructuring.
        extracted_test_case: Test case after Level 2 first-pass extraction.
        refined_extracted_test_case: Test case after Level 2 second-pass refinement.
        script_robot: Generated Robot Framework script (Level 3 output).
    """

    messages: Annotated[List[BaseMessage], add_messages]

    execution_status: GenIAStateStatus
    attempt_number: int

    test_case: str
    test_case_name: str
    output_directory: str

    current_module_index: int

    refined_test_case: Optional[TestCaseModel]
    extracted_test_case: Optional[ExtractedTestCaseModel]
    refined_extracted_test_case: Optional[ExtractedTestCaseModel]

    script_robot: Optional[str]

