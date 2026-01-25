"""Artists resource."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, AsyncIterator, Optional

from pokeforge_sdk.client.pagination import Page
from pokeforge_sdk.client.resources.base import BaseResource
from pokeforge_sdk.generated.models import ArtistList

if TYPE_CHECKING:
    from pokeforge_sdk.client.http import HttpClient


@dataclass
class ListArtistsOptions:
    """Options for listing artists."""

    page: int = 1
    page_size: int = 20
    search: Optional[str] = None


class ArtistsResource(BaseResource):
    """Artists API - browse card artists."""

    def __init__(self, http: HttpClient) -> None:
        super().__init__(http)

    async def list(
        self, options: Optional[ListArtistsOptions] = None
    ) -> Page[ArtistList]:
        """
        Get all artists with preview cards and collection progress.

        Example:
            page = await client.artists.list()
            async for artist in page:
                print(artist.name)
        """
        opts = options or ListArtistsOptions()
        query = self._build_query(
            page=opts.page,
            pageSize=opts.page_size,
            search=opts.search,
        )

        response = await self._http.get("/Artists", query)

        async def fetcher(page: int, page_size: int) -> Page[ArtistList]:
            new_opts = ListArtistsOptions(
                page=page,
                page_size=page_size,
                search=opts.search,
            )
            return await self.list(new_opts)

        return self._create_paged_response(response, ArtistList, fetcher)

    async def list_all(
        self, options: Optional[ListArtistsOptions] = None
    ) -> AsyncIterator[ArtistList]:
        """
        Convenience method to iterate through all artists.

        Example:
            async for artist in client.artists.list_all():
                print(artist.name)
        """
        opts = options or ListArtistsOptions()
        opts.page = 1
        page = await self.list(opts)
        async for artist in page:
            yield artist
