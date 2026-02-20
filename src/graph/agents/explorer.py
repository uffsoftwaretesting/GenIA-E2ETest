"""Explorer agent — extracts HTML elements from web pages via crawl4ai."""

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
async def extract_elements_from_page(
    url: str,
    instruction: str,
) -> ExtractionResultModel:
    """Extract HTML elements from a web page using LLM-based extraction.

    Args:
        url: The URL to crawl and extract elements from.
        instruction: Natural-language instruction for the LLM.

    Returns:
        An `ExtractionResultModel` containing the extracted elements,
        token usage, and dispatcher statistics.
    """
    logger.info(f"Extracting elements from: {url}")

    async with BrowserTool() as browser:
        result = await browser.extract_elements(
            url=url,
            instruction=instruction,
            schema=ExtractionContainer,
            temperature=EnvironmentVariables.ai_agents_temperature,
        )

    logger.info(f"Extraction completed for: {url}")

    container_obj = result.get("extracted_content")
    elements_list = container_obj.elements if container_obj else []

    return ExtractionResultModel(
        extracted_content=elements_list,
        token_usage=result["token_usage"],
        dispatcher_data=result["dispatcher_data"],
    )
