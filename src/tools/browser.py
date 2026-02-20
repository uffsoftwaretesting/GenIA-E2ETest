"""Browser tool for web crawling and element extraction using crawl4ai."""

import asyncio
import json
from datetime import datetime
from typing import Any, ClassVar, Dict, Optional, Type, TypeVar

from crawl4ai import (
    AsyncWebCrawler,
    BrowserConfig,
    CacheMode,
    CrawlerRunConfig,
    LLMConfig,
    MemoryAdaptiveDispatcher,
)
from crawl4ai.extraction_strategy import LLMExtractionStrategy
from pydantic import BaseModel, ValidationError

from src.env import env_variables
from src.utils.logger import get_logger

logger = get_logger(__name__)

T = TypeVar("T", bound=BaseModel)


class BrowserManager:
    """Singleton manager for the shared `AsyncWebCrawler` instance."""

    _instance: ClassVar[Optional["BrowserManager"]] = None
    _lock: ClassVar[asyncio.Lock] = asyncio.Lock()

    _crawler: Optional[AsyncWebCrawler] = None
    _in_use: bool = False

    def __new__(cls) -> "BrowserManager":
        """Return the single `BrowserManager` instance, creating it lazily."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def get_crawler(self) -> AsyncWebCrawler:
        """Acquire the crawler, starting it if necessary.

        Returns:
            The shared `AsyncWebCrawler` instance.
        """
        async with self._lock:
            if self._crawler is None:
                logger.info("Creating new AsyncWebCrawler instance")
                browser_config = BrowserConfig(headless=True)
                self._crawler = AsyncWebCrawler(config=browser_config)
                await self._crawler.__aenter__()

            self._in_use = True
            return self._crawler

    async def release(self) -> None:
        """Mark the crawler as no longer in use."""
        async with self._lock:
            self._in_use = False

    async def close(self) -> None:
        """Shut down the crawler if it is not currently in use."""
        async with self._lock:
            if self._crawler is not None and not self._in_use:
                logger.info("Closing AsyncWebCrawler instance")
                try:
                    await self._crawler.__aexit__(None, None, None)
                except Exception as error:
                    logger.warning(f"Error closing crawler: {error}")
                finally:
                    self._crawler = None


class BrowserTool:
    """Extract HTML elements from web pages using LLM-based extraction."""

    _browser_manager: ClassVar[BrowserManager] = BrowserManager()

    def __init__(self, api_key: Optional[str] = None) -> None:
        """Initialise the browser tool.

        Args:
            api_key: OpenAI API key. Falls back to the environment variable.
        """
        self.api_key = api_key or env_variables.api_key_string
        self.crawler: Optional[AsyncWebCrawler] = None
        self.dispatcher = MemoryAdaptiveDispatcher()

    async def __aenter__(self) -> "BrowserTool":
        """Enter the async context and acquire the shared crawler."""
        self.crawler = await self._browser_manager.get_crawler()
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Exit the async context and release the shared crawler."""
        await self._browser_manager.release()

    async def extract_elements(
        self,
        url: str,
        instruction: str,
        schema: Type[T],
        temperature: float = 0.0,
        model: str = "openai/gpt-4o-mini",
    ) -> Dict[str, Any]:
        """Crawl *url* and extract structured data described by *schema*.

        Args:
            url: Target web page URL.
            instruction: Natural-language instruction for the LLM extraction.
            schema: Pydantic model class to validate the extracted data against.
            temperature: Sampling temperature for the LLM.
            model: LLM provider/model identifier.

        Returns:
            Dictionary with keys `extracted_content`, `token_usage`, and
            `dispatcher_data`.

        Raises:
            RuntimeError: If the tool is used outside an async context manager,
                or if Playwright browsers are not installed.
        """
        if not self.crawler:
            raise RuntimeError("BrowserTool must be used as an async context manager")

        logger.info(f"Extracting elements from: {url}")

        llm_strategy = LLMExtractionStrategy(
            llm_config=LLMConfig(provider=model, api_token=self.api_key),
            schema=schema.model_json_schema(),
            extraction_type="schema",
            input_format="markdown",
            extra_args={"temperature": temperature},
            instruction=instruction,
        )

        crawl_config = CrawlerRunConfig(
            verbose=True,
            word_count_threshold=1,
            extraction_strategy=llm_strategy,
            cache_mode=CacheMode.BYPASS,
            wait_for="body",
        )

        results = await self.crawler.arun_many(
            urls=[url],
            config=crawl_config,
            dispatcher=self.dispatcher,
        )

        extracted_content: Optional[T] = None
        token_usage: Dict[str, Any] = {}
        dispatcher_data: Dict[str, Any] = {}

        crawl_results = (
            results
            if isinstance(results, list)
            else getattr(results, "results", [results])
        )

        for result in crawl_results:
            if not result.success:
                error_msg = result.error_message or "Unknown error"

                if "playwright install" in error_msg or "Executable doesn't exist" in error_msg:
                    logger.critical(
                        "PLAYWRIGHT BROWSERS MISSING! "
                        "Run 'playwright install chromium' and "
                        "'playwright install-deps chromium' in your Python environment."
                    )
                    raise RuntimeError(f"Critical Crawler Failure: {error_msg}")

                logger.warning(f"Extraction failed for {url}. Error: {error_msg}")
                continue

            logger.debug(f"Extraction successful for {url}")

            try:
                parsed_data = json.loads(result.extracted_content.strip())

                if isinstance(parsed_data, list):
                    parsed_data = {"elements": parsed_data}

                extracted_content = schema.model_validate(parsed_data)

                usage = llm_strategy.total_usage
                if usage:
                    token_usage = {
                        "completion_tokens": getattr(usage, "completion_tokens", 0),
                        "prompt_tokens": getattr(usage, "prompt_tokens", 0),
                        "total_tokens": getattr(usage, "total_tokens", 0),
                        "completion_tokens_details": getattr(usage, "completion_tokens_details", None),
                        "prompt_tokens_details": getattr(usage, "prompt_tokens_details", None),
                    }

                if hasattr(result, "dispatch_result") and result.dispatch_result:
                    start_time = datetime.fromtimestamp(result.dispatch_result.start_time)
                    end_time = datetime.fromtimestamp(result.dispatch_result.end_time)
                    dispatcher_data = {
                        "memory_usage_MB": getattr(result.dispatch_result, "memory_usage", 0.0),
                        "peak_memory_MB": getattr(result.dispatch_result, "peak_memory", 0.0),
                        "start_time": start_time.isoformat(),
                        "end_time": end_time.isoformat(),
                        "duration_seconds": (end_time - start_time).total_seconds(),
                    }

            except json.JSONDecodeError as error:
                logger.error(f"Failed to parse JSON returned by the LLM: {error}")
                logger.debug(f"Malformed content: {result.extracted_content}")

            except ValidationError as error:
                logger.error(f"Failed to validate JSON content against {schema.__name__}: {error}")
                logger.debug(f"Raw content received: {result.extracted_content}")

        return {
            "extracted_content": extracted_content,
            "token_usage": token_usage,
            "dispatcher_data": dispatcher_data,
        }
