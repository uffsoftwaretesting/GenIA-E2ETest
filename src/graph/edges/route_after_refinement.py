"""Routing function dispatched after the refinement node."""

from src.graph.state import GenIAState
from src.utils.enums import GenIANodeName, GenIAStateStatus
from src.utils.logger import get_logger

logger = get_logger(__name__)


def route_after_refinement(state: GenIAState) -> str:
    """Determine the next node after refinement completes.

    Routes to:
        - `EXPLORING_TASK`: to extract elements from the next module.
        - `CODING_TASK`: if all modules have been refined.

    Args:
        state: Current workflow state.

    Returns:
        Name of the next node.
    """
    execution_status = state["execution_status"]
    logger.debug(f"Routing after refinement, status: {execution_status}")

    if execution_status == GenIAStateStatus.EXPLORING:
        return GenIANodeName.EXPLORING_TASK.value
    if execution_status == GenIAStateStatus.CODING:
        return GenIANodeName.CODING_TASK.value

    logger.warning(f"Unexpected status after refinement: {execution_status}")
    return GenIANodeName.END.value
