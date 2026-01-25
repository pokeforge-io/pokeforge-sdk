"""Cards resource."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, AsyncIterator, Optional

from pokeforge_sdk.client.pagination import Page
from pokeforge_sdk.client.resources.base import BaseResource
from pokeforge_sdk.generated.models import (
    CardDetail,
    CardFilterOptions,
    CardList,
    CardSortField,
    CardVariant,
    SortOrder,
)

if TYPE_CHECKING:
    from pokeforge_sdk.client.http import HttpClient


@dataclass
class ListCardsOptions:
    """Options for listing cards."""

    page: int = 1
    page_size: int = 20
    set_id: Optional[str] = None
    series_id: Optional[str] = None
    rarity: Optional[str] = None
    supertype: Optional[str] = None
    subtype: Optional[str] = None
    pokemon_type: Optional[str] = None
    artist_name: Optional[str] = None
    sort_by: Optional[CardSortField] = None
    sort_order: Optional[SortOrder] = None
    search: Optional[str] = None


@dataclass
class SearchCardsOptions:
    """Options for searching cards."""

    q: str
    page: int = 1
    page_size: int = 20
    set_id: Optional[str] = None


class CardsResource(BaseResource):
    """Cards API - browse and search Pokemon cards."""

    def __init__(self, http: HttpClient) -> None:
        super().__init__(http)

    async def list(self, options: Optional[ListCardsOptions] = None) -> Page[CardList]:
        """
        Get all cards with optional filtering, sorting, and pagination.

        Example:
            # Get first page of cards
            page = await client.cards.list()

            # Filter by set and rarity
            page = await client.cards.list(ListCardsOptions(
                set_id='set-uuid',
                rarity='Rare,HoloRare'
            ))

            # Iterate through all pages
            async for card in client.cards.list():
                print(card.name)
        """
        opts = options or ListCardsOptions()
        query = self._build_query(
            page=opts.page,
            pageSize=opts.page_size,
            setId=opts.set_id,
            seriesId=opts.series_id,
            rarity=opts.rarity,
            supertype=opts.supertype,
            subtype=opts.subtype,
            pokemonType=opts.pokemon_type,
            artistName=opts.artist_name,
            sortBy=opts.sort_by.value if opts.sort_by else None,
            sortOrder=opts.sort_order.value if opts.sort_order else None,
            search=opts.search,
        )

        response = await self._http.get("/Cards", query)

        async def fetcher(page: int, page_size: int) -> Page[CardList]:
            new_opts = ListCardsOptions(
                page=page,
                page_size=page_size,
                set_id=opts.set_id,
                series_id=opts.series_id,
                rarity=opts.rarity,
                supertype=opts.supertype,
                subtype=opts.subtype,
                pokemon_type=opts.pokemon_type,
                artist_name=opts.artist_name,
                sort_by=opts.sort_by,
                sort_order=opts.sort_order,
                search=opts.search,
            )
            return await self.list(new_opts)

        return self._create_paged_response(response, CardList, fetcher)

    async def get(self, id: str) -> CardDetail:
        """
        Get a single card by ID with full details.

        Args:
            id: The card GUID
        """
        response = await self._http.get(f"/Cards/{id}")

        if not response or not response.get("data"):
            from pokeforge_sdk.client.errors import NotFoundError

            raise NotFoundError("Card not found")

        return CardDetail.model_validate(response["data"])

    async def search(self, options: SearchCardsOptions) -> Page[CardList]:
        """
        Search cards by name or number.

        Example:
            results = await client.cards.search(SearchCardsOptions(q='Pikachu'))
        """
        query = self._build_query(
            q=options.q,
            page=options.page,
            pageSize=options.page_size,
            setId=options.set_id,
        )

        response = await self._http.get("/Cards/search", query)

        async def fetcher(page: int, page_size: int) -> Page[CardList]:
            new_opts = SearchCardsOptions(
                q=options.q,
                page=page,
                page_size=page_size,
                set_id=options.set_id,
            )
            return await self.search(new_opts)

        return self._create_paged_response(response, CardList, fetcher)

    async def get_variants(self, id: str) -> list[CardVariant]:
        """
        Get all variants of a card (Normal, Reverse Holo, etc.).

        Args:
            id: The card GUID
        """
        response = await self._http.get(f"/Cards/{id}/variants")
        variants = response.get("variants") or []
        return [CardVariant.model_validate(v) for v in variants]

    async def get_filters(self) -> CardFilterOptions:
        """Get available filter options based on existing card data."""
        response = await self._http.get("/Cards/filters")

        if not response or not response.get("data"):
            from pokeforge_sdk.client.errors import PokeForgeError

            raise PokeForgeError("Failed to fetch card filters", 500)

        return CardFilterOptions.model_validate(response["data"])

    async def record_view(self, id: str) -> None:
        """
        Record a view for a card (analytics, fire-and-forget).

        Args:
            id: The card GUID
        """
        await self._http.post(f"/Cards/{id}/views")

    async def list_all(
        self, options: Optional[ListCardsOptions] = None
    ) -> AsyncIterator[CardList]:
        """
        Convenience method to iterate through all cards matching criteria.

        Example:
            async for card in client.cards.list_all(ListCardsOptions(rarity='Rare')):
                print(card.name)
        """
        opts = options or ListCardsOptions()
        opts.page = 1
        page = await self.list(opts)
        async for card in page:
            yield card
