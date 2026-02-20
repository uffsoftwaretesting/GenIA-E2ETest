"""Restructuring node (Level 1) — converts raw test case text into structured modules."""

from langchain_core.messages import AIMessage

from src.graph.agents.test_refactor import generate_test_case_refactor
from src.graph.state import GenIAState
from src.tools.gen_ia_client import GenIAClientProvider
from src.tools.load_prompt import load_prompt
from src.utils.enums import GenIAStateStatus
from src.utils.logger import get_logger

logger = get_logger(__name__)


def restructuring_node(state: GenIAState) -> GenIAState:
    """Analyse a test case and break it into URL-scoped modules.

    Args:
        state: Current workflow state.

    Returns:
        Updated state with `refined_test_case` populated.

    Raises:
        ValueError: If the LLM returns `None`.
    """
    logger.info("Starting test case restructuring...")

    state["execution_status"] = GenIAStateStatus.RESTRUCTURING

    prompt = load_prompt(
        "level1_restructuring.j2",
        test_case=state["test_case"],
    )

    refined_test_case = generate_test_case_refactor(
        client=GenIAClientProvider.get_client(),
        prompt=prompt,
    )

    if refined_test_case is None:
        raise ValueError("Failed to restructure test case — LLM returned None")

    state["refined_test_case"] = refined_test_case
    state["current_module_index"] = 0

    state["messages"].append(
        AIMessage(
            content=f"Test case restructured with {len(refined_test_case.modules)} modules",
            name="restructuring",
        )
    )

    logger.info(f"Test case restructured successfully: {len(refined_test_case.modules)} modules")
    return state
