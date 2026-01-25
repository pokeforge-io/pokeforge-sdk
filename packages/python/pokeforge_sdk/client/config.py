"""Configuration for the PokeForge client."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Awaitable, Callable, Union


@dataclass(frozen=True)
class RetryConfig:
    """Configuration for retry behavior."""

    base_delay: float = 1.0
    max_delay: float = 30.0
    exponential: bool = True


@dataclass(frozen=True)
class StaticAuth:
    """Static token authentication."""

    token: str


@dataclass(frozen=True)
class DynamicAuth:
    """Dynamic token authentication via callback."""

    get_token: Callable[[], Union[str, Awaitable[str]]]


AuthConfig = Union[StaticAuth, DynamicAuth, None]


@dataclass
class PokeForgeClientConfig:
    """Configuration for the PokeForge client."""

    base_url: str = "https://api.pokeforge.gg"
    auth: AuthConfig = None
    timeout: float = 30.0
    retries: int = 3
    retry_config: RetryConfig = field(default_factory=RetryConfig)
