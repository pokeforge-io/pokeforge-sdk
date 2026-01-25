"""Collections resource."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, AsyncIterator, Optional

from pokeforge_sdk.client.pagination import Page
from pokeforge_sdk.client.resources.base import BaseResource
from pokeforge_sdk.generated.models import (
    AddCollectionItemRequest,
    BulkAddItemsRequest,
    BulkAddItemsResult,
    CardCondition,
    CollectionDetail,
    CollectionItem,
    CollectionList,
    CollectionType,
    CollectionVisibility,
    CreateCollectionRequest,
    UpdateCollectionItemRequest,
    UpdateCollectionRequest,
)

if TYPE_CHECKING:
    from pokeforge_sdk.client.http import HttpClient


@dataclass
class ListCollectionsOptions:
    """Options for listing collections."""

    page: int = 1
    page_size: int = 20
    collection_type: Optional[CollectionType] = None


@dataclass
class ListCollectionItemsOptions:
    """Options for listing collection items."""

    page: int = 1
    page_size: int = 20


class CollectionsResource(BaseResource):
    """Collections API - manage user card collections."""

    def __init__(self, http: HttpClient) -> None:
        super().__init__(http)

    async def list(
        self, options: Optional[ListCollectionsOptions] = None
    ) -> Page[CollectionList]:
        """
        Get all collections for the authenticated user.

        Example:
            page = await client.collections.list()
            async for collection in page:
                print(collection.name)
        """
        opts = options or ListCollectionsOptions()
        query = self._build_query(
            page=opts.page,
            pageSize=opts.page_size,
            collectionType=(
                opts.collection_type.value if opts.collection_type else None
            ),
        )

        response = await self._http.get("/Collections", query)

        async def fetcher(page: int, page_size: int) -> Page[CollectionList]:
            new_opts = ListCollectionsOptions(
                page=page,
                page_size=page_size,
                collection_type=opts.collection_type,
            )
            return await self.list(new_opts)

        return self._create_paged_response(response, CollectionList, fetcher)

    async def get(self, id: str) -> CollectionDetail:
        """
        Get a single collection by ID.

        Args:
            id: The collection GUID
        """
        response = await self._http.get(f"/Collections/{id}")

        if not response or not response.get("data"):
            from pokeforge_sdk.client.errors import NotFoundError

            raise NotFoundError("Collection not found")

        return CollectionDetail.model_validate(response["data"])

    async def create(
        self,
        name: str,
        collection_type: CollectionType = CollectionType.COLLECTION,
        visibility: CollectionVisibility = CollectionVisibility.PRIVATE,
        description: Optional[str] = None,
    ) -> CollectionDetail:
        """
        Create a new collection.

        Args:
            name: Collection name
            collection_type: Type of collection
            visibility: Collection visibility
            description: Optional description
        """
        request = CreateCollectionRequest(
            name=name,
            description=description,
            collection_type=collection_type,
            visibility=visibility,
        )

        response = await self._http.post(
            "/Collections", request.model_dump(by_alias=True, exclude_none=True)
        )

        if not response or not response.get("data"):
            from pokeforge_sdk.client.errors import PokeForgeError

            raise PokeForgeError("Failed to create collection", 500)

        return CollectionDetail.model_validate(response["data"])

    async def update(
        self,
        id: str,
        name: Optional[str] = None,
        visibility: Optional[CollectionVisibility] = None,
        description: Optional[str] = None,
    ) -> CollectionDetail:
        """
        Update an existing collection.

        Args:
            id: The collection GUID
            name: New name
            visibility: New visibility
            description: New description
        """
        request = UpdateCollectionRequest(
            name=name,
            description=description,
            visibility=visibility,
        )

        response = await self._http.put(
            f"/Collections/{id}", request.model_dump(by_alias=True, exclude_none=True)
        )

        if not response or not response.get("data"):
            from pokeforge_sdk.client.errors import PokeForgeError

            raise PokeForgeError("Failed to update collection", 500)

        return CollectionDetail.model_validate(response["data"])

    async def delete(self, id: str) -> None:
        """
        Delete a collection.

        Args:
            id: The collection GUID
        """
        await self._http.delete(f"/Collections/{id}")

    async def list_items(
        self, collection_id: str, options: Optional[ListCollectionItemsOptions] = None
    ) -> Page[CollectionItem]:
        """
        Get items in a collection.

        Args:
            collection_id: The collection GUID
            options: Pagination options
        """
        opts = options or ListCollectionItemsOptions()
        query = self._build_query(
            page=opts.page,
            pageSize=opts.page_size,
        )

        response = await self._http.get(f"/Collections/{collection_id}/items", query)

        async def fetcher(page: int, page_size: int) -> Page[CollectionItem]:
            new_opts = ListCollectionItemsOptions(page=page, page_size=page_size)
            return await self.list_items(collection_id, new_opts)

        return self._create_paged_response(response, CollectionItem, fetcher)

    async def add_item(
        self,
        collection_id: str,
        card_id: str,
        quantity: int = 1,
        condition: Optional[CardCondition] = None,
        grade: Optional[str] = None,
        purchase_price: Optional[float] = None,
        notes: Optional[str] = None,
    ) -> CollectionItem:
        """
        Add a card to a collection.

        Args:
            collection_id: The collection GUID
            card_id: The card GUID
            quantity: Number of copies
            condition: Card condition
            grade: Professional grade (e.g., "PSA 10")
            purchase_price: Purchase price
            notes: Additional notes
        """
        request = AddCollectionItemRequest(
            card_id=card_id,
            quantity=quantity,
            condition=condition,
            grade=grade,
            purchase_price=purchase_price,
            notes=notes,
        )

        response = await self._http.post(
            f"/Collections/{collection_id}/items",
            request.model_dump(by_alias=True, exclude_none=True),
        )

        if not response or not response.get("data"):
            from pokeforge_sdk.client.errors import PokeForgeError

            raise PokeForgeError("Failed to add item to collection", 500)

        return CollectionItem.model_validate(response["data"])

    async def update_item(
        self,
        collection_id: str,
        item_id: str,
        quantity: Optional[int] = None,
        condition: Optional[CardCondition] = None,
        grade: Optional[str] = None,
        purchase_price: Optional[float] = None,
        notes: Optional[str] = None,
    ) -> CollectionItem:
        """
        Update a collection item.

        Args:
            collection_id: The collection GUID
            item_id: The item GUID
            quantity: Updated quantity
            condition: Updated condition
            grade: Updated grade
            purchase_price: Updated purchase price
            notes: Updated notes
        """
        request = UpdateCollectionItemRequest(
            quantity=quantity,
            condition=condition,
            grade=grade,
            purchase_price=purchase_price,
            notes=notes,
        )

        response = await self._http.put(
            f"/Collections/{collection_id}/items/{item_id}",
            request.model_dump(by_alias=True, exclude_none=True),
        )

        if not response or not response.get("data"):
            from pokeforge_sdk.client.errors import PokeForgeError

            raise PokeForgeError("Failed to update collection item", 500)

        return CollectionItem.model_validate(response["data"])

    async def delete_item(self, collection_id: str, item_id: str) -> None:
        """
        Remove an item from a collection.

        Args:
            collection_id: The collection GUID
            item_id: The item GUID
        """
        await self._http.delete(f"/Collections/{collection_id}/items/{item_id}")

    async def bulk_add_items(
        self, collection_id: str, items: list[AddCollectionItemRequest]
    ) -> BulkAddItemsResult:
        """
        Bulk add items to a collection.

        Args:
            collection_id: The collection GUID
            items: List of items to add
        """
        request = BulkAddItemsRequest(items=items)

        response = await self._http.post(
            f"/Collections/{collection_id}/items/bulk",
            request.model_dump(by_alias=True, exclude_none=True),
        )

        if not response or not response.get("data"):
            from pokeforge_sdk.client.errors import PokeForgeError

            raise PokeForgeError("Failed to bulk add items", 500)

        return BulkAddItemsResult.model_validate(response["data"])

    async def list_all(
        self, options: Optional[ListCollectionsOptions] = None
    ) -> AsyncIterator[CollectionList]:
        """
        Convenience method to iterate through all collections.

        Example:
            async for collection in client.collections.list_all():
                print(collection.name)
        """
        opts = options or ListCollectionsOptions()
        opts.page = 1
        page = await self.list(opts)
        async for collection in page:
            yield collection
