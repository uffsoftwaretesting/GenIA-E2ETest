"""File system utilities for reading, writing, and managing test case artefacts."""

import json
from pathlib import Path
from typing import Any, Dict, Union

from src.utils.logger import get_logger

logger = get_logger(__name__)


def create_directory_if_not_exists(path: Union[str, Path]) -> None:
    """Create a directory (and parents) if it does not already exist.

    Args:
        path: Path to the directory to create.
    """
    Path(path).mkdir(parents=True, exist_ok=True)
    logger.debug(f"Directory ensured: {path}")


def write_file(file_path: Union[str, Path], content: str) -> None:
    """Write string content to a file using UTF-8 encoding.

    Args:
        file_path: Destination file path.
        content: Text content to write.
    """
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(content)

    logger.info(f"Wrote file: {file_path}")


def read_file(file_path: Union[str, Path]) -> str:
    """Read a file and return its content as a string.

    Args:
        file_path: Path to the file.

    Returns:
        The full text content of the file.
    """
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()

    logger.debug(f"Read file: {file_path}")
    return content


def write_json_file(file_path: Union[str, Path], data: Dict[str, Any]) -> None:
    """Serialise a dictionary to a JSON file.

    Args:
        file_path: Destination JSON file path.
        data: Dictionary to serialise.
    """
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

    logger.debug(f"Wrote JSON file: {file_path}")


def read_json_file(file_path: Union[str, Path]) -> Dict[str, Any]:
    """Read a JSON file and return its content as a dictionary.

    Args:
        file_path: Path to the JSON file.

    Returns:
        Parsed JSON data.
    """
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    logger.debug(f"Read JSON file: {file_path}")
    return data

