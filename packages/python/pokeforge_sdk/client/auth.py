"""Token management for authentication."""

from __future__ import annotations

import asyncio
from typing import Optional

from pokeforge_sdk.client.config import AuthConfig, DynamicAuth, StaticAuth


class TokenManager:
    """Manages authentication tokens for API requests."""

    def __init__(self, auth: AuthConfig = None) -> None:
        self._static_token: Optional[str] = None
        self._get_token_fn: Optional[object] = None

        if isinstance(auth, StaticAuth):
            self._static_token = auth.token
        elif isinstance(auth, DynamicAuth):
            self._get_token_fn = auth.get_token

    async def get_token(self) -> Optional[str]:
        """Get the current token (async to support dynamic tokens)."""
        if self._static_token:
            return self._static_token

        if self._get_token_fn:
            result = self._get_token_fn()  # type: ignore[operator]
            if asyncio.iscoroutine(result):
                return await result
            return result  # type: ignore[return-value]

        return None

    def set_token(self, token: str) -> None:
        """Update static token (for token refresh scenarios)."""
        self._static_token = token
        self._get_token_fn = None

    def has_auth(self) -> bool:
        """Check if authentication is configured."""
        return bool(self._static_token or self._get_token_fn)
