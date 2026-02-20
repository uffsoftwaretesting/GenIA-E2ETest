"""Main entry point for GenIA E2E Test Generator.

Processes test case files and generates Robot Framework E2E tests
using the LangGraph workflow orchestrator.
"""

import asyncio
from pathlib import Path

from src.env import env_variables
from src.graph.orchestrator import GenIAStateOrchestrator
from src.tools.file_system import read_file
from src.utils.logger import get_logger

logger = get_logger(__name__)


async def process_test_cases(
    input_dir: Path,
    output_dir: Path,
    num_attempts: int = 1,
) -> None:
    """Process all test case files in *input_dir*.

    Args:
        input_dir: Folder containing `.feature` test case files.
        output_dir: Folder for output artefacts.
        num_attempts: Number of attempts per test case.
    """
    orchestrator = GenIAStateOrchestrator(output_dir)

    for test_file in input_dir.iterdir():
        if not test_file.is_file():
            continue

        logger.info(f"Processing test case: {test_file.name}")

        test_case_content = read_file(test_file)
        test_case_name = test_file.stem

        for attempt in range(1, num_attempts + 1):
            logger.info(f"Attempt {attempt}/{num_attempts} for {test_case_name}")

            try:
                final_state = await orchestrator.run(
                    test_case_content,
                    test_case_name,
                    attempt,
                )

                if not final_state.get("script_robot"):
                    logger.warning(f"No script generated for {test_case_name}")
                    continue

                logger.info(f"Successfully generated test for {test_case_name}")
            except Exception as error:
                logger.error(f"Error processing {test_case_name}: {error}")
                raise


async def main() -> None:
    """Application entry point."""
    logger.info("Starting GenIA E2E Test Generator...")

    input_dir = env_variables.test_cases_examples_folder
    output_dir = env_variables.test_cases_output_folder

    await process_test_cases(input_dir, output_dir, num_attempts=3)

    logger.info("GenIA E2E Test Generator completed.")


if __name__ == "__main__":
    asyncio.run(main())
