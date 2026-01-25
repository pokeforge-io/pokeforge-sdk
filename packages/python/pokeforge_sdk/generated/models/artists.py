"""Artist models."""

from typing import Optional

from pydantic import BaseModel, Field


class ArtistPreviewCard(BaseModel):
    """Preview card for artist display."""

    id: str
    name: Optional[str] = None
    image_url_standard: Optional[str] = Field(default=None, alias="imageUrlStandard")

    model_config = {"populate_by_name": True}


class ArtistList(BaseModel):
    """Artist list item with preview cards and collection progress."""

    name: Optional[str] = None
    total_cards: int = Field(default=0, alias="totalCards")
    collected_cards: int = Field(default=0, alias="collectedCards")
    preview_cards: Optional[list[ArtistPreviewCard]] = Field(default=None, alias="previewCards")

    model_config = {"populate_by_name": True}
