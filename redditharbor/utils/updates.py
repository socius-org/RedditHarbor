"""
Update notifications.

RedditHarbor checks PyPI once per Python session for a newer release and prints a
notice if one exists, in the same spirit as praw's update checker. Older releases can
stop working when upstream services change (for example Supabase retiring its legacy
API keys), so it is worth knowing when a newer version is available.

Set the environment variable ``REDDITHARBOR_NO_UPDATE_CHECK=1`` to disable the check
(for example on machines without internet access or in automated pipelines).
"""

import os
import re
from typing import Optional, Tuple

import requests
from rich.console import Console

from redditharbor import __version__

console = Console()

PYPI_URL = "https://pypi.org/pypi/redditharbor/json"
DISABLE_ENV_VAR = "REDDITHARBOR_NO_UPDATE_CHECK"

_checked = False


def _parse_version(version: str) -> Tuple[int, ...]:
    """Turn '0.4.0' (or '0.4.0rc1') into a comparable tuple of ints."""
    return tuple(int(part) for part in re.findall(r"\d+", version)) or (0,)


def check_for_updates(timeout: float = 2.0) -> Optional[str]:
    """
    Print a notice if a newer RedditHarbor release is available on PyPI.

    The check runs at most once per session, never raises, and is skipped when the
    ``REDDITHARBOR_NO_UPDATE_CHECK`` environment variable is set.

    Args:
        timeout (float, optional): Seconds to wait for PyPI before giving up. Defaults to 2.0.

    Returns:
        Optional[str]: The latest version on PyPI if it could be determined, else None.
    """
    global _checked
    if _checked or os.environ.get(DISABLE_ENV_VAR):
        return None
    _checked = True

    try:
        latest = requests.get(PYPI_URL, timeout=timeout).json()["info"]["version"]
    except Exception:
        return None

    if _parse_version(latest) > _parse_version(__version__):
        console.print(
            f"[bold yellow]A newer version of RedditHarbor is available ({__version__} -> {latest}).[/] "
            "Older versions may stop working as Reddit and Supabase evolve. Upgrade with:\n"
            "    pip install --upgrade redditharbor\n"
            "Release notes: https://github.com/socius-org/RedditHarbor/blob/main/CHANGELOG.md"
        )
    return latest
