"""Planner agent — restructures a raw test case into a structured model."""

from tenacity import retry, stop_after_attempt, wait_exponential

from src.env import env_variables
from src.env.index import EnvironmentVariables
from src.models.test_case import TestCaseModel
from src.tools.gen_ia_client import GenIAClient


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def generate_test_case_refactor(client: GenIAClient, prompt: str) -> TestCaseModel | None:
    """Restructure a test case into a `TestCaseModel` using structured LLM output.

    Args:
        client: OpenAI client instance.
        prompt: System prompt with restructuring instructions.

    Returns:
        Parsed `TestCaseModel`, or `None` if parsing fails.

    Raises:
        Exception: After three retry attempts with exponential back-off.
    """
    completion = client.beta.chat.completions.parse(
        model=env_variables.ai_agent_model,
        messages=[{"role": "system", "content": prompt}],
        response_format=TestCaseModel,
        temperature=EnvironmentVariables.ai_agents_temperature,
        n=EnvironmentVariables.ai_agents_responses_quantity,
    )

    return completion.choices[-1].message.parsed
