"""Pagination support with async iteration."""

from __future__ import annotations

from dataclasses import dataclass
from typing import (
    TYPE_CHECKING,
    Any,
    AsyncIterator,
    Awaitable,
    Callable,
    Generic,
    Optional,
    TypeVar,
)

if TYPE_CHECKING:
    pass

T = TypeVar("T")


@dataclass(frozen=True)
class PageInfo:
    """Pagination metadata."""

    page: int
    page_size: int
    total_count: int
    total_pages: int
    has_next: bool
    has_previous: bool


PageFetcher = Callable[[int, int], Awaitable["Page[T]"]]


class Page(Generic[T]):
    """Represents a page of results with pagination metadata and async iteration."""

    def __init__(
        self, data: list[T], pagination: PageInfo, fetcher: PageFetcher[T]
    ) -> None:
        self._data = data
        self._pagination = pagination
        self._fetcher = fetcher

    @property
    def data(self) -> list[T]:
        """Get the items on this page."""
        return self._data

    @property
    def pagination(self) -> PageInfo:
        """Get pagination metadata."""
        return self._pagination

    async def next_page(self) -> Optional[Page[T]]:
        """Fetch the next page (if available)."""
        if not self._pagination.has_next:
            return None
        return await self._fetcher(
            self._pagination.page + 1, self._pagination.page_size
        )

    async def previous_page(self) -> Optional[Page[T]]:
        """Fetch the previous page (if available)."""
        if not self._pagination.has_previous:
            return None
        return await self._fetcher(
            self._pagination.page - 1, self._pagination.page_size
        )

    async def go_to_page(self, page: int) -> Page[T]:
        """Fetch a specific page."""
        return await self._fetcher(page, self._pagination.page_size)

    async def to_list(self) -> list[T]:
        """Convert all pages to a single list (fetches remaining pages)."""
        all_items = list(self._data)
        current_page: Optional[Page[T]] = self

        while current_page and current_page._pagination.has_next:
            current_page = await current_page.next_page()
            if current_page:
                all_items.extend(current_page._data)

        return all_items

    def __aiter__(self) -> AsyncIterator[T]:
        """Support async iteration through all pages."""
        return self._async_iter()

    async def _async_iter(self) -> AsyncIterator[T]:
        """Async iterator implementation."""
        # Yield items from current page
        for item in self._data:
            yield item

        # Fetch and yield from subsequent pages
        current_page: Optional[Page[T]] = self
        while current_page and current_page._pagination.has_next:
            current_page = await current_page.next_page()
            if current_page:
                for item in current_page._data:
                    yield item


def create_page(
    data: list[T], pagination_info: Optional[dict[str, Any]], fetcher: PageFetcher[T]
) -> Page[T]:
    """Create a Page instance from API response."""
    pagination = PageInfo(
        page=pagination_info.get("page", 1) if pagination_info else 1,
        page_size=(
            pagination_info.get("pageSize", len(data)) if pagination_info else len(data)
        ),
        total_count=(
            pagination_info.get("totalCount", len(data)) if pagination_info else len(data)
        ),
        total_pages=pagination_info.get("totalPages", 1) if pagination_info else 1,
        has_next=pagination_info.get("hasNext", False) if pagination_info else False,
        has_previous=(
            pagination_info.get("hasPrevious", False) if pagination_info else False
        ),
    )

    return Page(data=data, pagination=pagination, fetcher=fetcher)
