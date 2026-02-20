"""Refinement node (Level 2) — refines and validates extracted elements."""

import json

from langchain_core.messages import AIMessage

from src.graph.agents.refiner import refine_extracted_elements
from src.graph.state import GenIAState
from src.models.extracted_module_model import ExtractedModuleModel
from src.models.extraction_result import ExtractionResultModel
from src.tools.load_prompt import load_prompt
from src.tools.parser import map_extracted_data_to_steps
from src.utils.enums import GenIAStateStatus
from src.utils.logger import get_logger

logger = get_logger(__name__)


async def refinement_node(state: GenIAState) -> GenIAState:
    """Refine extracted HTML elements for the current module (second pass).

    Takes elements from the extraction phase and validates / improves
    XPaths and element identifiers to ensure robustness.

    Args:
        state: Current workflow state.

    Returns:
        Updated state with refined elements for the current module.

    Raises:
        ValueError: If required state fields are missing.
    """
    logger.info("Starting element refinement...")

    state["execution_status"] = GenIAStateStatus.REFINING

    refined_test_case = state.get("refined_test_case")
    extracted_test_case = state.get("extracted_test_case")

    if refined_test_case is None:
        raise ValueError("refined_test_case is required for refinement")
    if extracted_test_case is None:
        raise ValueError("extracted_test_case is required for refinement")

    module_idx = state["current_module_index"]
    total_modules = len(refined_test_case.modules)

    if module_idx >= total_modules:
        logger.info("All modules already refined, moving to coding phase")
        state["execution_status"] = GenIAStateStatus.CODING
        return state

    refined_extracted_test_case = state.get("refined_extracted_test_case")
    if refined_extracted_test_case is None:
        raise ValueError("refined_extracted_test_case is required for refinement")

    current_module_extracted = refined_extracted_test_case.modules[module_idx]
    logger.info(f"Refining module {module_idx + 1}/{total_modules}: {current_module_extracted.url}")

    prompt = load_prompt(
        "level2_refinement.j2",
        module_with_extracted_data=json.dumps(
            current_module_extracted.model_dump(exclude_none=True, mode="json"),
            indent=2,
        ),
    )

    refinement_result: ExtractionResultModel = await refine_extracted_elements(
        url=current_module_extracted.url,
        instruction=prompt,
    )

    current_module_extracted.token = refinement_result.token_usage
    current_module_extracted.dispatcher = refinement_result.dispatcher_data

    current_module_extracted = map_extracted_data_to_steps(
        module_model=current_module_extracted,
        extracted_elements=refinement_result.extracted_content,
    )

    refined_extracted_test_case.modules[module_idx] = current_module_extracted

    state["current_module_index"] = module_idx + 1

    if state["current_module_index"] >= total_modules:
        logger.info("All modules refined, moving to coding phase")
        state["execution_status"] = GenIAStateStatus.CODING
    else:
        state["execution_status"] = GenIAStateStatus.EXPLORING

    state["messages"].append(
        AIMessage(
            content=f"Elements refined for module {module_idx + 1}/{total_modules}: {current_module_extracted.url}",
            name="refinement",
        )
    )

    logger.info(f"Refinement completed for module {module_idx + 1}")
    return state
