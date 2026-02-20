"""Application logging system."""

import logging
import sys
from datetime import datetime
from pathlib import Path


def setup_logger(name: str = "GenIA-E2ETest", level: int = logging.INFO) -> logging.Logger:
    """Configure the root application logger with console and file handlers.

    Args:
        name: Logger name.
        level: Logging level.

    Returns:
        Configured logger instance.
    """
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    logger.setLevel(level)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)

    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)

    log_file = logs_dir / f"genia_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(level)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger


def get_logger(name: str) -> logging.Logger:
    """Return a child logger scoped under the application root logger.

    Args:
        name: Module or component name.

    Returns:
        Logger instance.
    """
    return logging.getLogger(f"GenIA-E2ETest.{name}")


# Eagerly configure the root logger on import.
main_logger = setup_logger()
