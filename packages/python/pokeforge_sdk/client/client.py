"""Main PokeForge client."""

from __future__ import annotations

from dataclasses import replace
from typing import Optional

from pokeforge_sdk.client.config import PokeForgeClientConfig
from pokeforge_sdk.client.http import HttpClient
from pokeforge_sdk.client.resources.artists import ArtistsResource
from pokeforge_sdk.client.resources.blog import BlogResource
from pokeforge_sdk.client.resources.cards import CardsResource
from pokeforge_sdk.client.resources.collections import CollectionsResource
from pokeforge_sdk.client.resources.favorites import FavoritesResource
from pokeforge_sdk.client.resources.series import SeriesResource
from pokeforge_sdk.client.resources.sets import SetsResource


class PokeForgeClient:
    """
    The main PokeForge API client.

    Example:
        from pokeforge_sdk import PokeForgeClient
        from pokeforge_sdk.client.config import PokeForgeClientConfig, StaticAuth

        async with PokeForgeClient(PokeForgeClientConfig(
            base_url='https://api.pokeforge.gg',
            auth=StaticAuth(token='your-jwt-token')
        )) as client:
            # List cards
            page = await client.cards.list()
            print(page.data)

            # Get a single card
            card = await client.cards.get('card-uuid')

            # Iterate through all cards
            async for card in client.cards.list():
                print(card.name)
    """

    def __init__(self, config: Optional[PokeForgeClientConfig] = None) -> None:
        self._config = config or PokeForgeClientConfig()
        self._http = HttpClient(self._config)

        # Initialize all resource classes
        self.cards = CardsResource(self._http)
        self.sets = SetsResource(self._http)
        self.series = SeriesResource(self._http)
        self.collections = CollectionsResource(self._http)
        self.favorites = FavoritesResource(self._http)
        self.artists = ArtistsResource(self._http)
        self.blog = BlogResource(self._http)

    async def __aenter__(self) -> PokeForgeClient:
        """Context manager entry."""
        await self._http.__aenter__()
        return self

    async def __aexit__(
        self,
        exc_type: Optional[type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[object],
    ) -> None:
        """Context manager exit."""
        await self._http.__aexit__(exc_type, exc_val, exc_tb)

    def with_config(self, **kwargs: object) -> PokeForgeClient:
        """
        Create a new client instance with updated configuration.
        Useful for changing authentication mid-session.
        """
        new_config = replace(self._config, **kwargs)  # type: ignore[arg-type]
        return PokeForgeClient(new_config)

    async def health(self) -> None:
        """
        Health check endpoint.
        Raises if the API is not reachable.
        """
        await self._http.get("/health")
