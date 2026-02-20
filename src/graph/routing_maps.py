"""Static routing maps consumed by LangGraph conditional edges."""

from typing import Dict, Hashable

from src.utils.enums import GenIANodeName

type RouteMap = Dict[Hashable, str]

restructuring_routes_map: RouteMap = {
    GenIANodeName.EXPLORING_TASK.value: GenIANodeName.EXPLORING_TASK.value,
}

extraction_routes_map: RouteMap = {
    GenIANodeName.REFINING_TASK.value: GenIANodeName.REFINING_TASK.value,
}

refinement_routes_map: RouteMap = {
    GenIANodeName.EXPLORING_TASK.value: GenIANodeName.EXPLORING_TASK.value,
    GenIANodeName.CODING_TASK.value: GenIANodeName.CODING_TASK.value,
}
