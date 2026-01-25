"""Favorites resource."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, AsyncIterator, Optional

from pokeforge_sdk.client.pagination import Page
from pokeforge_sdk.client.resources.base import BaseResource
from pokeforge_sdk.generated.models import FavoriteCard, FavoriteCheckResult

if TYPE_CHECKING:
    from pokeforge_sdk.client.http import HttpClient


@dataclass
class ListFavoritesOptions:
    """Options for listing favorites."""

    page: int = 1
    page_size: int = 20


class FavoritesResource(BaseResource):
    """Favorites API - manage favorite cards."""

    def __init__(self, http: HttpClient) -> None:
        super().__init__(http)

    async def list(
        self, options: Optional[ListFavoritesOptions] = None
    ) -> Page[FavoriteCard]:
        """
        Get all favorite cards for the authenticated user.

        Example:
            page = await client.favorites.list()
            async for favorite in page:
                print(favorite.name)
        """
        opts = options or ListFavoritesOptions()
        query = self._build_query(
            page=opts.page,
            pageSize=opts.page_size,
        )

        response = await self._http.get("/Favorites", query)

        async def fetcher(page: int, page_size: int) -> Page[FavoriteCard]:
            new_opts = ListFavoritesOptions(page=page, page_size=page_size)
            return await self.list(new_opts)

        return self._create_paged_response(response, FavoriteCard, fetcher)

    async def add(self, card_id: str) -> None:
        """
        Add a card to favorites.

        Args:
            card_id: The card GUID
        """
        await self._http.post(f"/Favorites/{card_id}")

    async def remove(self, card_id: str) -> None:
        """
        Remove a card from favorites.

        Args:
            card_id: The card GUID
        """
        await self._http.delete(f"/Favorites/{card_id}")

    async def check(self, card_id: str) -> bool:
        """
        Check if a card is favorited.

        Args:
            card_id: The card GUID

        Returns:
            True if the card is favorited, False otherwise
        """
        response = await self._http.get("/Favorites/check", {"cardId": card_id})

        if not response:
            return False

        result = FavoriteCheckResult.model_validate(response)
        return result.is_favorited

    async def list_all(
        self, options: Optional[ListFavoritesOptions] = None
    ) -> AsyncIterator[FavoriteCard]:
        """
        Convenience method to iterate through all favorites.

        Example:
            async for favorite in client.favorites.list_all():
                print(favorite.name)
        """
        opts = options or ListFavoritesOptions()
        opts.page = 1
        page = await self.list(opts)
        async for favorite in page:
            yield favorite
