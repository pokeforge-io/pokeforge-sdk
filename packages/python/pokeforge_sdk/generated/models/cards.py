"""Card models."""

from typing import Optional

from pydantic import BaseModel, Field


class CardSetInfo(BaseModel):
    """Set information embedded in card details."""

    id: str
    name: Optional[str] = None
    slug: Optional[str] = None
    logo_url: Optional[str] = Field(default=None, alias="logoUrl")

    model_config = {"populate_by_name": True}


class CardList(BaseModel):
    """Card list item (lightweight representation)."""

    id: str
    name: Optional[str] = None
    number: Optional[str] = None
    set_id: str = Field(alias="setId")
    set_name: Optional[str] = Field(default=None, alias="setName")
    supertype: Optional[str] = None
    subtypes: Optional[list[str]] = None
    rarity: Optional[str] = None
    types: Optional[list[str]] = None
    image_url_standard: Optional[str] = Field(default=None, alias="imageUrlStandard")
    image_url_hi_res: Optional[str] = Field(default=None, alias="imageUrlHiRes")
    variant_type_code: Optional[str] = Field(default=None, alias="variantTypeCode")
    variant_type_name: Optional[str] = Field(default=None, alias="variantTypeName")
    artist_name: Optional[str] = Field(default=None, alias="artistName")

    model_config = {"populate_by_name": True}


class CardDetail(BaseModel):
    """Full card details."""

    id: str
    name: Optional[str] = None
    number: Optional[str] = None
    set: Optional[CardSetInfo] = None
    supertype: Optional[str] = None
    subtypes: Optional[list[str]] = None
    rarity: Optional[str] = None
    types: Optional[list[str]] = None
    hp: Optional[int] = None
    evolves_from: Optional[str] = Field(default=None, alias="evolvesFrom")
    flavor_text: Optional[str] = Field(default=None, alias="flavorText")
    artist_name: Optional[str] = Field(default=None, alias="artistName")
    image_url_standard: Optional[str] = Field(default=None, alias="imageUrlStandard")
    image_url_hi_res: Optional[str] = Field(default=None, alias="imageUrlHiRes")
    attacks: Optional[str] = None
    abilities: Optional[str] = None
    weaknesses: Optional[str] = None
    resistances: Optional[str] = None
    retreat_cost: Optional[int] = Field(default=None, alias="retreatCost")
    variant_type_code: Optional[str] = Field(default=None, alias="variantTypeCode")
    variant_type_name: Optional[str] = Field(default=None, alias="variantTypeName")

    model_config = {"populate_by_name": True}


class CardVariant(BaseModel):
    """Card variant information."""

    id: str
    name: Optional[str] = None
    number: Optional[str] = None
    rarity: Optional[str] = None
    variant_type_code: Optional[str] = Field(default=None, alias="variantTypeCode")
    variant_type_name: Optional[str] = Field(default=None, alias="variantTypeName")
    image_url_standard: Optional[str] = Field(default=None, alias="imageUrlStandard")

    model_config = {"populate_by_name": True}


class CardFilterOptions(BaseModel):
    """Available filter options based on existing card data."""

    rarities: Optional[list[str]] = None
    supertypes: Optional[list[str]] = None
    subtypes: Optional[list[str]] = None
    types: Optional[list[str]] = None

    model_config = {"populate_by_name": True}
