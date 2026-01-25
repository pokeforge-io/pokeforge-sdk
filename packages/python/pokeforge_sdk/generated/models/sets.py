"""Set models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SeriesInfo(BaseModel):
    """Series information embedded in set details."""

    id: str
    name: Optional[str] = None
    slug: Optional[str] = None

    model_config = {"populate_by_name": True}


class SetList(BaseModel):
    """Set list item (lightweight representation)."""

    id: str
    name: Optional[str] = None
    slug: Optional[str] = None
    series_id: str = Field(alias="seriesId")
    series_name: Optional[str] = Field(default=None, alias="seriesName")
    release_date: Optional[datetime] = Field(default=None, alias="releaseDate")
    total_cards: int = Field(default=0, alias="totalCards")
    logo_url: Optional[str] = Field(default=None, alias="logoUrl")
    symbol_url: Optional[str] = Field(default=None, alias="symbolUrl")

    model_config = {"populate_by_name": True}


class SetDetail(BaseModel):
    """Full set details."""

    id: str
    name: Optional[str] = None
    slug: Optional[str] = None
    series: Optional[SeriesInfo] = None
    release_date: Optional[datetime] = Field(default=None, alias="releaseDate")
    total_cards: int = Field(default=0, alias="totalCards")
    printed_total: Optional[int] = Field(default=None, alias="printedTotal")
    logo_url: Optional[str] = Field(default=None, alias="logoUrl")
    symbol_url: Optional[str] = Field(default=None, alias="symbolUrl")

    model_config = {"populate_by_name": True}
