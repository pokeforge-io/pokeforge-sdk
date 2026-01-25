"""Favorites models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FavoriteCard(BaseModel):
    """Favorite card item."""

    id: str
    card_id: str = Field(alias="cardId")
    name: Optional[str] = None
    number: Optional[str] = None
    set_name: Optional[str] = Field(default=None, alias="setName")
    rarity: Optional[str] = None
    image_url_standard: Optional[str] = Field(default=None, alias="imageUrlStandard")
    added_at: Optional[datetime] = Field(default=None, alias="addedAt")

    model_config = {"populate_by_name": True}


class FavoriteCheckResult(BaseModel):
    """Result of checking if a card is favorited."""

    is_favorited: bool = Field(alias="isFavorited")

    model_config = {"populate_by_name": True}
