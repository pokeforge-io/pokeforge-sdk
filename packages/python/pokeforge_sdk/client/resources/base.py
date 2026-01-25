"""Base resource class."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Awaitable, Callable, TypeVar

from pokeforge_sdk.client.pagination import Page, create_page

if TYPE_CHECKING:
    from pokeforge_sdk.client.http import HttpClient

T = TypeVar("T")


class BaseResource:
    """Abstract base class for all resource classes."""

    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def _create_paged_response(
        self,
        response: dict[str, Any],
        item_type: type[T],
        fetcher: Callable[[int, int], Awaitable[Page[T]]],
    ) -> Page[T]:
        """Create paginated response from API response."""
        data = response.get("data") or []
        # Convert raw dicts to Pydantic models
        items = [
            item_type.model_validate(item) if isinstance(item, dict) else item
            for item in data
        ]
        pagination = response.get("pagination")
        return create_page(items, pagination, fetcher)

    @staticmethod
    def _build_query(**kwargs: Any) -> dict[str, Any]:
        """Build query params, filtering out None values."""
        return {k: v for k, v in kwargs.items() if v is not None}
