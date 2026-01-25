"""Series resource."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, AsyncIterator, Optional

from pokeforge_sdk.client.pagination import Page
from pokeforge_sdk.client.resources.base import BaseResource
from pokeforge_sdk.generated.models import SeriesDetail, SeriesList, SortOrder

if TYPE_CHECKING:
    from pokeforge_sdk.client.http import HttpClient


@dataclass
class ListSeriesOptions:
    """Options for listing series."""

    page: int = 1
    page_size: int = 20
    search: Optional[str] = None
    sort_order: Optional[SortOrder] = None


class SeriesResource(BaseResource):
    """Series API - browse card series."""

    def __init__(self, http: HttpClient) -> None:
        super().__init__(http)

    async def list(
        self, options: Optional[ListSeriesOptions] = None
    ) -> Page[SeriesList]:
        """
        Get all series with optional filtering and pagination.

        Example:
            page = await client.series.list()
            async for series in page:
                print(series.name)
        """
        opts = options or ListSeriesOptions()
        query = self._build_query(
            page=opts.page,
            pageSize=opts.page_size,
            search=opts.search,
            sortOrder=opts.sort_order.value if opts.sort_order else None,
        )

        response = await self._http.get("/Series", query)

        async def fetcher(page: int, page_size: int) -> Page[SeriesList]:
            new_opts = ListSeriesOptions(
                page=page,
                page_size=page_size,
                search=opts.search,
                sort_order=opts.sort_order,
            )
            return await self.list(new_opts)

        return self._create_paged_response(response, SeriesList, fetcher)

    async def get(self, id: str) -> SeriesDetail:
        """
        Get a single series by ID.

        Args:
            id: The series GUID
        """
        response = await self._http.get(f"/Series/{id}")

        if not response or not response.get("data"):
            from pokeforge_sdk.client.errors import NotFoundError

            raise NotFoundError("Series not found")

        return SeriesDetail.model_validate(response["data"])

    async def get_by_slug(self, slug: str) -> SeriesDetail:
        """
        Get a single series by slug.

        Args:
            slug: The series slug (e.g., "base")
        """
        response = await self._http.get(f"/Series/slug/{slug}")

        if not response or not response.get("data"):
            from pokeforge_sdk.client.errors import NotFoundError

            raise NotFoundError("Series not found")

        return SeriesDetail.model_validate(response["data"])

    async def list_all(
        self, options: Optional[ListSeriesOptions] = None
    ) -> AsyncIterator[SeriesList]:
        """
        Convenience method to iterate through all series.

        Example:
            async for series in client.series.list_all():
                print(series.name)
        """
        opts = options or ListSeriesOptions()
        opts.page = 1
        page = await self.list(opts)
        async for series_item in page:
            yield series_item
