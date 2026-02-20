"""Routing function dispatched after the extraction node."""

from src.graph.state import GenIAState
from src.utils.enums import GenIANodeName, GenIAStateStatus
from src.utils.logger import get_logger

logger = get_logger(__name__)


def route_after_extraction(state: GenIAState) -> str:
    """Determine the next node after extraction completes.

    Routes to:
        - `REFINING_TASK`: always routes to refinement after extraction.

    Args:
        state: Current workflow state.

    Returns:
        Name of the next node.
    """
    execution_status = state["execution_status"]
    logger.debug(f"Routing after extraction, status: {execution_status}")

    if execution_status == GenIAStateStatus.REFINING:
        return GenIANodeName.REFINING_TASK.value

    logger.warning(f"Unexpected status after extraction: {execution_status}")
    return GenIANodeName.REFINING_TASK.value
