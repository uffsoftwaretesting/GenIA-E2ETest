"""Routing function dispatched after the restructuring node."""

from src.graph.state import GenIAState
from src.utils.enums import GenIANodeName, GenIAStateStatus
from src.utils.logger import get_logger

logger = get_logger(__name__)


def route_after_restructuring(state: GenIAState) -> str:
    """Determine the next node after restructuring completes.

    Args:
        state: Current workflow state.

    Returns:
        Name of the next node.
    """
    execution_status = state["execution_status"]

    if execution_status == GenIAStateStatus.RESTRUCTURING:
        return GenIANodeName.EXPLORING_TASK.value

    logger.warning(f"Unexpected status after restructuring: {execution_status}")
    return GenIANodeName.END.value
    