"""Enum types for the PokeForge API."""

from enum import Enum


class CardSortField(str, Enum):
    """Sort field for card listings."""

    NAME = "Name"
    NUMBER = "Number"
    RARITY = "Rarity"
    SET_NAME = "SetName"


class SortOrder(str, Enum):
    """Sort order direction."""

    ASC = "Asc"
    DESC = "Desc"


class CardCondition(str, Enum):
    """Physical condition of a trading card."""

    NM = "NM"  # Near Mint
    LP = "LP"  # Lightly Played
    MP = "MP"  # Moderately Played
    HP = "HP"  # Heavily Played
    DMG = "DMG"  # Damaged


class CollectionType(str, Enum):
    """Type of collection."""

    COLLECTION = "Collection"
    WISHLIST = "Wishlist"
    FAVORITES = "Favorites"


class CollectionVisibility(str, Enum):
    """Visibility of a collection."""

    PUBLIC = "Public"
    PRIVATE = "Private"
