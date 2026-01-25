"""Resource classes for PokeForge API endpoints."""

from pokeforge_sdk.client.resources.artists import ArtistsResource
from pokeforge_sdk.client.resources.base import BaseResource
from pokeforge_sdk.client.resources.blog import BlogResource
from pokeforge_sdk.client.resources.cards import CardsResource
from pokeforge_sdk.client.resources.collections import CollectionsResource
from pokeforge_sdk.client.resources.favorites import FavoritesResource
from pokeforge_sdk.client.resources.series import SeriesResource
from pokeforge_sdk.client.resources.sets import SetsResource

__all__ = [
    "BaseResource",
    "CardsResource",
    "SetsResource",
    "SeriesResource",
    "CollectionsResource",
    "FavoritesResource",
    "ArtistsResource",
    "BlogResource",
]
