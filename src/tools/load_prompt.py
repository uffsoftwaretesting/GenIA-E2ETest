"""Jinja2 template loader for agent prompts."""

from jinja2 import Environment, FileSystemLoader

from src.env import env_variables

_env = Environment(loader=FileSystemLoader(env_variables.prompts_dir))


def load_prompt(template_name: str, **kwargs: object) -> str:
    """Render a Jinja2 prompt template with the given variables.

    Example:

        load_prompt('level1_restructuring.jinja2', test_case='...')

    Args:
        template_name: Relative path to the template inside the prompts directory.
        **kwargs: Variables passed to the template.

    Returns:
        The rendered prompt string.
    """
    template = _env.get_template(template_name)
    
    return template.render(**kwargs)
