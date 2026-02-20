"""Enumerations used across the GenIA workflow."""

from enum import StrEnum, auto

from langgraph.graph import END, START


class GenIANodeName(StrEnum):
    """Node identifiers for the LangGraph workflow."""

    START = START
    END = END
    RESTRUCTURING_TASK = auto()
    EXPLORING_TASK = auto()
    REFINING_TASK = auto()
    CODING_TASK = auto()


class GenIAStateStatus(StrEnum):
    """Execution status of the workflow state machine."""

    STARTING = auto()
    RESTRUCTURING = auto()
    EXPLORING = auto()
    REFINING = auto()
    CODING = auto()
    FINISHED = auto()

