"""Sets resource."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, AsyncIterator, Optional

from pokeforge_sdk.client.pagination import Page
from pokeforge_sdk.client.resources.base import BaseResource
from pokeforge_sdk.generated.models import SetDetail, SetList, SortOrder

if TYPE_CHECKING:
    from pokeforge_sdk.client.http import HttpClient


@dataclass
class ListSetsOptions:
    """Options for listing sets."""

    page: int = 1
    page_size: int = 20
    series_id: Optional[str] = None
    search: Optional[str] = None
    sort_order: Optional[SortOrder] = None


class SetsResource(BaseResource):
    """Sets API - browse card sets."""

    def __init__(self, http: HttpClient) -> None:
        super().__init__(http)

    async def list(self, options: Optional[ListSetsOptions] = None) -> Page[SetList]:
        """
        Get all sets with optional filtering and pagination.

        Example:
            page = await client.sets.list()
            async for set in page:
                print(set.name)
        """
        opts = options or ListSetsOptions()
        query = self._build_query(
            page=opts.page,
            pageSize=opts.page_size,
            seriesId=opts.series_id,
            search=opts.search,
            sortOrder=opts.sort_order.value if opts.sort_order else None,
        )

        response = await self._http.get("/Sets", query)

        async def fetcher(page: int, page_size: int) -> Page[SetList]:
            new_opts = ListSetsOptions(
                page=page,
                page_size=page_size,
                series_id=opts.series_id,
                search=opts.search,
                sort_order=opts.sort_order,
            )
            return await self.list(new_opts)

        return self._create_paged_response(response, SetList, fetcher)

    async def get(self, id: str) -> SetDetail:
        """
        Get a single set by ID.

        Args:
            id: The set GUID
        """
        response = await self._http.get(f"/Sets/{id}")

        if not response or not response.get("data"):
            from pokeforge_sdk.client.errors import NotFoundError

            raise NotFoundError("Set not found")

        return SetDetail.model_validate(response["data"])

    async def get_by_slug(self, slug: str) -> SetDetail:
        """
        Get a single set by slug.

        Args:
            slug: The set slug (e.g., "base-set")
        """
        response = await self._http.get(f"/Sets/slug/{slug}")

        if not response or not response.get("data"):
            from pokeforge_sdk.client.errors import NotFoundError

            raise NotFoundError("Set not found")

        return SetDetail.model_validate(response["data"])

    async def list_all(
        self, options: Optional[ListSetsOptions] = None
    ) -> AsyncIterator[SetList]:
        """
        Convenience method to iterate through all sets.

        Example:
            async for set in client.sets.list_all():
                print(set.name)
        """
        opts = options or ListSetsOptions()
        opts.page = 1
        page = await self.list(opts)
        async for set_item in page:
            yield set_item
