"""GenIA E2E Test Orchestrator — LangGraph workflow for E2E test generation.

This orchestrator coordinates the following phases:
    1. **Restructuring** (Level 1): Break test case into modules by URL.
    2. **Extraction** (Level 2): Extract HTML elements from each page.
    3. **Refinement** (Level 2): Refine and validate extracted elements.
    4. **Generation** (Level 3): Generate Robot Framework script.
"""

from pathlib import Path
from typing import Union

from langchain_core.runnables import Runnable
from langgraph.graph import StateGraph
from langgraph.graph.state import CompiledStateGraph

from src.graph.edges import (
    route_after_extraction,
    route_after_refinement,
    route_after_restructuring,
)
from src.graph.nodes import (
    extraction_node,
    generation_node,
    refinement_node,
    restructuring_node,
)
from src.graph.routing_maps import (
    extraction_routes_map,
    refinement_routes_map,
    restructuring_routes_map,
)
from src.graph.state import GenIAState
from src.tools.file_system import (
    create_directory_if_not_exists,
    write_file,
    write_json_file,
)
from src.utils.enums import GenIANodeName, GenIAStateStatus
from src.utils.logger import get_logger

logger = get_logger(__name__)

class GenIAStateOrchestrator:
    """Orchestrator for the E2E test generation LangGraph workflow.

    Builds and manages the workflow that processes test cases through
    restructuring, extraction, refinement, and code generation.
    """

    graph: Runnable[GenIAState, GenIAState]

    def __init__(self, output_dir: Union[str, Path]) -> None:
        """Initialise the orchestrator and compile the graph.

        Args:
            output_dir: Directory for output files.
        """
        self.output_dir: Path = Path(output_dir)
        create_directory_if_not_exists(output_dir)
        self.graph = self._build_graph()
        self.visualize_workflow()
    
    def _build_graph(self) -> CompiledStateGraph:
        """Build and compile the LangGraph workflow with all nodes and edges."""
        logger.info("Building GenIA workflow graph...")
        
        workflow = StateGraph(GenIAState)
        
        # Add all nodes
        workflow.add_node(GenIANodeName.RESTRUCTURING_TASK, restructuring_node)
        workflow.add_node(GenIANodeName.EXPLORING_TASK, extraction_node)
        workflow.add_node(GenIANodeName.REFINING_TASK, refinement_node)
        workflow.add_node(GenIANodeName.CODING_TASK, generation_node)
        
        # Add conditional edges for routing
        workflow.add_conditional_edges(
            GenIANodeName.RESTRUCTURING_TASK,
            route_after_restructuring,
            restructuring_routes_map
        )
        
        workflow.add_conditional_edges(
            GenIANodeName.EXPLORING_TASK,
            route_after_extraction,
            extraction_routes_map
        )
        
        workflow.add_conditional_edges(
            GenIANodeName.REFINING_TASK,
            route_after_refinement,
            refinement_routes_map
        )
        
        # Add static edges
        workflow.add_edge(GenIANodeName.START, GenIANodeName.RESTRUCTURING_TASK)
        workflow.add_edge(GenIANodeName.CODING_TASK, GenIANodeName.END)
        
        logger.info("Workflow graph built successfully")
        
        # Compile the graph
        return workflow.compile()
    
    def visualize_workflow(self, file_name: str = "workflow.png") -> Path:
        """Save a PNG visualization of the compiled workflow graph.

        Args:
            file_name: Output file name.

        Returns:
            Path to the saved image.
        """
        output_path = self.output_dir / file_name
        png_bytes = self.graph.get_graph().draw_mermaid_png()
        output_path.write_bytes(png_bytes)
        logger.info(f"Workflow graph saved to: {output_path}")
        return output_path
    
    async def run(
        self,
        test_case: str,
        test_case_name: str,
        attempt_number: int = 1,
    ) -> GenIAState:
        """Execute the workflow for a single test case.

        Args:
            test_case: Raw test case text content.
            test_case_name: Name identifier for the test case.
            attempt_number: Attempt number (for retries).

        Returns:
            Final workflow state.

        Raises:
            RuntimeError: If the graph has not been initialized.
        """
        if self.graph is None:
            raise RuntimeError("Workflow graph not initialized")
        
        logger.info(f"Starting workflow for test case: {test_case_name}")
        
        # Create output directory structure
        test_case_folder = self.output_dir / test_case_name
        attempt_folder = test_case_folder / f"{attempt_number}. {test_case_name}"
        
        create_directory_if_not_exists(attempt_folder)
        
        # Initialize state
        initial_state: GenIAState = {
            "messages": [],
            "attempt_number": attempt_number,
            "test_case": test_case,
            "test_case_name": test_case_name,
            "current_module_index": 0,
            "execution_status": GenIAStateStatus.STARTING,
            "output_directory": str(attempt_folder),
            "refined_test_case": None,
            "script_robot": None,
            "extracted_test_case": None,
            "refined_extracted_test_case": None,
        }
        
        # Run the workflow
        final_state = await self.graph.ainvoke(initial_state)
        
        # Save output files
        self._save_outputs(final_state, attempt_folder)
        
        logger.info(f"Workflow completed for test case: {test_case_name}")
        
        return final_state
    
    def _save_outputs(self, state: GenIAState, output_folder: Path) -> None:
        """Persist workflow outputs (JSON artifacts and Robot script) to disk.

        Args:
            state: Final workflow state.
            output_folder: Directory to save outputs into.
        """
        logger.info(f"Saving outputs to: {output_folder}")
        
        # Save extracted data (Level 2)
        extracted_test_case = state.get("extracted_test_case")
        if extracted_test_case is not None:
            extracted_file = output_folder / "ExtractedData.json"
            write_json_file(extracted_file, extracted_test_case.model_dump(exclude_none=True, mode='json'))
        
        # Save refined extracted data (Level 2)
        refined_extracted_test_case = state.get("refined_extracted_test_case")
        if refined_extracted_test_case is not None:
            refined_file = output_folder / "RefinedExtractedData.json"
            write_json_file(refined_file, refined_extracted_test_case.model_dump(exclude_none=True, mode='json'))
        
        # Save Robot Framework script (Level 3)
        script_robot = state.get("script_robot")
        if script_robot is not None:
            robot_file = output_folder / "E2ETest.robot"
            write_file(robot_file, script_robot)
        
        logger.info("All outputs saved successfully")

    
