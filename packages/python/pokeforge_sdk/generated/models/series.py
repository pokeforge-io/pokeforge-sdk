"""Series models."""

from typing import Optional

from pydantic import BaseModel, Field


class SeriesList(BaseModel):
    """Series list item."""

    id: str
    name: Optional[str] = None
    slug: Optional[str] = None
    total_sets: int = Field(default=0, alias="totalSets")
    total_cards: int = Field(default=0, alias="totalCards")

    model_config = {"populate_by_name": True}


class SeriesDetail(BaseModel):
    """Full series details."""

    id: str
    name: Optional[str] = None
    slug: Optional[str] = None
    total_sets: int = Field(default=0, alias="totalSets")
    total_cards: int = Field(default=0, alias="totalCards")

    model_config = {"populate_by_name": True}
