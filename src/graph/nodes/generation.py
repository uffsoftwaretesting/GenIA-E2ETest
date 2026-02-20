"""Code generation node (Level 3) — generates a Robot Framework test script."""

import json

from langchain_core.messages import AIMessage

from src.graph.agents.coder import generate_robot_script
from src.graph.state import GenIAState
from src.tools.gen_ia_client import GenIAClientProvider
from src.tools.load_prompt import load_prompt
from src.utils.enums import GenIAStateStatus
from src.utils.logger import get_logger

logger = get_logger(__name__)


def generation_node(state: GenIAState) -> GenIAState:
    """Generate a Robot Framework E2E test script from refined extraction data.

    Args:
        state: Current workflow state.

    Returns:
        Updated state with `script_robot` populated.

    Raises:
        ValueError: If `refined_extracted_test_case` is missing.
    """
    logger.info("Starting Robot Framework script generation...")

    state["execution_status"] = GenIAStateStatus.CODING

    refined_extracted_test_case = state.get("refined_extracted_test_case")
    if refined_extracted_test_case is None:
        raise ValueError("refined_extracted_test_case is required for code generation")

    prompt = load_prompt(
        "level3_generation.j2",
        test_case_with_extracted_data=json.dumps(
            refined_extracted_test_case.model_dump(exclude_none=True, mode="json"),
            indent=2,
        ),
    )

    logger.info("Calling coder agent to generate Robot Framework script...")

    robot_script = generate_robot_script(
        client=GenIAClientProvider.get_client(),
        prompt=prompt,
    )

    state["script_robot"] = robot_script
    state["execution_status"] = GenIAStateStatus.FINISHED

    state["messages"].append(
        AIMessage(
            content="Robot Framework script generated successfully",
            name="generation",
        )
    )

    logger.info("Robot Framework script generated successfully")
    return state
