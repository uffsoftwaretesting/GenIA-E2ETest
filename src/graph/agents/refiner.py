"""Refiner agent — re-crawls a page to validate and improve extracted elements."""

from playwright._impl._errors import TargetClosedError
from tenacity import (
    retry,
    retry_if_not_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from src.env.index import EnvironmentVariables
from src.models.extraction_container import ExtractionContainer
from src.models.extraction_result import ExtractionResultModel
from src.tools.browser import BrowserTool
from src.utils.logger import get_logger

logger = get_logger(__name__)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=4, max=15),
    retry=retry_if_not_exception_type(TargetClosedError),
)
async def refine_extracted_elements(
    url: str,
    instruction: str,
) -> ExtractionResultModel:
    """Re-extract HTML elements from *url* to refine a previous extraction pass.

    Args:
        url: The URL to re-crawl.
        instruction: Refinement instruction for the LLM.

    Returns:
        An ``ExtractionResultModel`` with the refined elements, token usage,
        and dispatcher statistics.
    """
    logger.info(f"Refining elements for: {url}")

    async with BrowserTool() as browser:
        result = await browser.extract_elements(
            url=url,
            instruction=instruction,
            schema=ExtractionContainer,
            temperature=EnvironmentVariables.ai_agents_temperature,
        )

    logger.info(f"Refinement completed for: {url}")

    container_obj = result.get("extracted_content")
    elements_list = container_obj.elements if container_obj else []

    return ExtractionResultModel(
        extracted_content=elements_list,
        token_usage=result["token_usage"],
        dispatcher_data=result["dispatcher_data"],
    )
