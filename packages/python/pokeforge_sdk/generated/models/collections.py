"""Collection models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from pokeforge_sdk.generated.models.enums import (
    CardCondition,
    CollectionType,
    CollectionVisibility,
)


class CollectionList(BaseModel):
    """Collection list item."""

    id: str
    name: Optional[str] = None
    collection_type: CollectionType = Field(alias="collectionType")
    visibility: CollectionVisibility
    item_count: int = Field(default=0, alias="itemCount")
    total_value: Optional[float] = Field(default=None, alias="totalValue")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class CollectionDetail(BaseModel):
    """Full collection details."""

    id: str
    name: Optional[str] = None
    description: Optional[str] = None
    collection_type: CollectionType = Field(alias="collectionType")
    visibility: CollectionVisibility
    item_count: int = Field(default=0, alias="itemCount")
    unique_cards: int = Field(default=0, alias="uniqueCards")
    total_value: Optional[float] = Field(default=None, alias="totalValue")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class CollectionItemCard(BaseModel):
    """Card information in collection item."""

    id: str
    name: Optional[str] = None
    number: Optional[str] = None
    set_name: Optional[str] = Field(default=None, alias="setName")
    rarity: Optional[str] = None
    image_url_standard: Optional[str] = Field(default=None, alias="imageUrlStandard")

    model_config = {"populate_by_name": True}


class CollectionItem(BaseModel):
    """Item in a collection."""

    id: str
    card: CollectionItemCard
    quantity: int = 1
    condition: Optional[CardCondition] = None
    grade: Optional[str] = None
    purchase_price: Optional[float] = Field(default=None, alias="purchasePrice")
    purchase_date: Optional[datetime] = Field(default=None, alias="purchaseDate")
    notes: Optional[str] = None
    added_at: Optional[datetime] = Field(default=None, alias="addedAt")

    model_config = {"populate_by_name": True}


class CreateCollectionRequest(BaseModel):
    """Request to create a collection."""

    name: str
    description: Optional[str] = None
    collection_type: CollectionType = Field(
        default=CollectionType.COLLECTION, alias="collectionType"
    )
    visibility: CollectionVisibility = CollectionVisibility.PRIVATE

    model_config = {"populate_by_name": True}


class UpdateCollectionRequest(BaseModel):
    """Request to update a collection."""

    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[CollectionVisibility] = None

    model_config = {"populate_by_name": True}


class AddCollectionItemRequest(BaseModel):
    """Request to add a card to a collection."""

    card_id: str = Field(alias="cardId")
    quantity: int = 1
    condition: Optional[CardCondition] = None
    grade: Optional[str] = None
    purchase_price: Optional[float] = Field(default=None, alias="purchasePrice")
    purchase_date: Optional[datetime] = Field(default=None, alias="purchaseDate")
    notes: Optional[str] = None

    model_config = {"populate_by_name": True}


class UpdateCollectionItemRequest(BaseModel):
    """Request to update a collection item."""

    quantity: Optional[int] = None
    condition: Optional[CardCondition] = None
    grade: Optional[str] = None
    purchase_price: Optional[float] = Field(default=None, alias="purchasePrice")
    purchase_date: Optional[datetime] = Field(default=None, alias="purchaseDate")
    notes: Optional[str] = None

    model_config = {"populate_by_name": True}


class BulkAddItemsRequest(BaseModel):
    """Request to bulk add items to a collection."""

    items: list[AddCollectionItemRequest]

    model_config = {"populate_by_name": True}


class BulkItemError(BaseModel):
    """Error details for bulk operations."""

    identifier: Optional[str] = None
    error: Optional[str] = None

    model_config = {"populate_by_name": True}


class BulkAddItemsResult(BaseModel):
    """Result of a bulk add operation."""

    total_processed: int = Field(default=0, alias="totalProcessed")
    created: int = 0
    errors: Optional[list[BulkItemError]] = None

    model_config = {"populate_by_name": True}
