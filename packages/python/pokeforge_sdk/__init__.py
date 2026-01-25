"""PokeForge SDK - Official Python SDK for the PokeForge API."""

from pokeforge_sdk.client.client import PokeForgeClient
from pokeforge_sdk.client.config import (
    DynamicAuth,
    PokeForgeClientConfig,
    RetryConfig,
    StaticAuth,
)
from pokeforge_sdk.client.errors import (
    AuthenticationError,
    ForbiddenError,
    NetworkError,
    NotFoundError,
    PokeForgeError,
    RateLimitError,
    TimeoutError,
    ValidationError,
)
from pokeforge_sdk.client.pagination import Page, PageInfo

__version__ = "0.1.0"

__all__ = [
    # Client
    "PokeForgeClient",
    # Config
    "PokeForgeClientConfig",
    "StaticAuth",
    "DynamicAuth",
    "RetryConfig",
    # Errors
    "PokeForgeError",
    "NotFoundError",
    "AuthenticationError",
    "ForbiddenError",
    "RateLimitError",
    "ValidationError",
    "TimeoutError",
    "NetworkError",
    # Pagination
    "Page",
    "PageInfo",
]
