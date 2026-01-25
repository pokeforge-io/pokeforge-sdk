"""HTTP client for making API requests."""

from __future__ import annotations

import asyncio
from typing import Any, Optional

import httpx

from pokeforge_sdk.client.auth import TokenManager
from pokeforge_sdk.client.config import PokeForgeClientConfig
from pokeforge_sdk.client.errors import (
    NetworkError,
    PokeForgeError,
    RateLimitError,
    TimeoutError,
)


class HttpClient:
    """HTTP client for making API requests with retry logic."""

    def __init__(self, config: PokeForgeClientConfig) -> None:
        self._config = config
        self._base_url = config.base_url.rstrip("/")
        self._token_manager = TokenManager(config.auth)
        self._timeout = httpx.Timeout(config.timeout)
        self._retries = config.retries
        self._retry_config = config.retry_config
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self) -> HttpClient:
        """Context manager entry - creates the httpx client."""
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            timeout=self._timeout,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
        )
        return self

    async def __aexit__(
        self,
        exc_type: Optional[type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[object],
    ) -> None:
        """Context manager exit - closes the httpx client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    def get_config(self) -> PokeForgeClientConfig:
        """Get the current configuration."""
        return self._config

    async def request(
        self,
        method: str,
        path: str,
        query: Optional[dict[str, Any]] = None,
        body: Optional[Any] = None,
        timeout: Optional[float] = None,
        no_retry: bool = False,
    ) -> Any:
        """Make an HTTP request with retry logic."""
        if self._client is None:
            raise RuntimeError("HttpClient must be used as async context manager")

        url = path
        headers = await self._build_headers()
        request_timeout = httpx.Timeout(timeout) if timeout else self._timeout
        max_attempts = 1 if no_retry else self._retries + 1
        last_error: Optional[Exception] = None

        for attempt in range(1, max_attempts + 1):
            try:
                response = await self._client.request(
                    method=method,
                    url=url,
                    params=self._filter_none(query) if query else None,
                    json=body,
                    headers=headers,
                    timeout=request_timeout,
                )

                if response.is_success:
                    if response.status_code == 204:
                        return None
                    content_type = response.headers.get("content-type", "")
                    if "application/json" in content_type:
                        return response.json()
                    return None

                # Handle errors
                error = await self._handle_error_response(response)

                # Retry on 429 or 5xx
                if attempt < max_attempts and (
                    response.status_code == 429 or response.status_code >= 500
                ):
                    delay = self._calculate_delay(attempt, error)
                    await asyncio.sleep(delay)
                    continue

                raise error

            except httpx.TimeoutException as e:
                raise TimeoutError(
                    f"Request timed out after {timeout or self._config.timeout}s"
                ) from e
            except httpx.NetworkError as e:
                if attempt < max_attempts:
                    delay = self._calculate_delay(attempt)
                    await asyncio.sleep(delay)
                    last_error = e
                    continue
                raise NetworkError("Network error", e) from e
            except PokeForgeError:
                raise
            except Exception as e:
                raise NetworkError(f"Unexpected error: {e}", e) from e

        raise NetworkError("Request failed after retries", last_error)

    async def get(self, path: str, query: Optional[dict[str, Any]] = None) -> Any:
        """GET request."""
        return await self.request("GET", path, query=query)

    async def post(self, path: str, body: Optional[Any] = None) -> Any:
        """POST request."""
        return await self.request("POST", path, body=body)

    async def put(self, path: str, body: Optional[Any] = None) -> Any:
        """PUT request."""
        return await self.request("PUT", path, body=body)

    async def delete(self, path: str, body: Optional[Any] = None) -> Any:
        """DELETE request."""
        return await self.request("DELETE", path, body=body)

    async def _build_headers(self) -> dict[str, str]:
        """Build request headers including auth token."""
        headers: dict[str, str] = {}
        token = await self._token_manager.get_token()
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    async def _handle_error_response(self, response: httpx.Response) -> PokeForgeError:
        """Create appropriate error from response."""
        body = None
        try:
            body = response.json()
        except Exception:
            pass

        if response.status_code == 429:
            retry_after_header = response.headers.get("retry-after")
            retry_ms = int(retry_after_header) * 1000 if retry_after_header else None
            error = PokeForgeError.from_response(response.status_code, body)
            if isinstance(error, RateLimitError):
                error.retry_after = retry_ms
            return error

        return PokeForgeError.from_response(response.status_code, body)

    def _calculate_delay(
        self, attempt: int, error: Optional[PokeForgeError] = None
    ) -> float:
        """Calculate retry delay with exponential backoff."""
        if isinstance(error, RateLimitError) and error.retry_after:
            return min(error.retry_after / 1000, self._retry_config.max_delay)

        if self._retry_config.exponential:
            delay = self._retry_config.base_delay * (2 ** (attempt - 1))
            return min(delay, self._retry_config.max_delay)

        return self._retry_config.base_delay

    @staticmethod
    def _filter_none(d: dict[str, Any]) -> dict[str, Any]:
        """Filter out None values from dict."""
        return {k: v for k, v in d.items() if v is not None}
