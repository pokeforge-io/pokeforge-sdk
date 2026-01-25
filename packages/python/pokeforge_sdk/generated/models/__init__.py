"""Generated Pydantic models."""

from pokeforge_sdk.generated.models.artists import ArtistList, ArtistPreviewCard
from pokeforge_sdk.generated.models.blog import BlogAuthor, BlogPost, BlogPostMedia
from pokeforge_sdk.generated.models.cards import (
    CardDetail,
    CardFilterOptions,
    CardList,
    CardSetInfo,
    CardVariant,
)
from pokeforge_sdk.generated.models.collections import (
    AddCollectionItemRequest,
    BulkAddItemsRequest,
    BulkAddItemsResult,
    BulkItemError,
    CollectionDetail,
    CollectionItem,
    CollectionItemCard,
    CollectionList,
    CreateCollectionRequest,
    UpdateCollectionItemRequest,
    UpdateCollectionRequest,
)
from pokeforge_sdk.generated.models.enums import (
    CardCondition,
    CardSortField,
    CollectionType,
    CollectionVisibility,
    SortOrder,
)
from pokeforge_sdk.generated.models.favorites import FavoriteCard, FavoriteCheckResult
from pokeforge_sdk.generated.models.pagination import PaginationInfo
from pokeforge_sdk.generated.models.problem_details import ProblemDetails
from pokeforge_sdk.generated.models.series import SeriesDetail, SeriesList
from pokeforge_sdk.generated.models.sets import SeriesInfo, SetDetail, SetList

__all__ = [
    # Pagination
    "PaginationInfo",
    # Errors
    "ProblemDetails",
    # Enums
    "CardSortField",
    "SortOrder",
    "CardCondition",
    "CollectionType",
    "CollectionVisibility",
    # Cards
    "CardList",
    "CardDetail",
    "CardVariant",
    "CardSetInfo",
    "CardFilterOptions",
    # Sets
    "SetList",
    "SetDetail",
    "SeriesInfo",
    # Series
    "SeriesList",
    "SeriesDetail",
    # Collections
    "CollectionList",
    "CollectionDetail",
    "CollectionItem",
    "CollectionItemCard",
    "CreateCollectionRequest",
    "UpdateCollectionRequest",
    "AddCollectionItemRequest",
    "UpdateCollectionItemRequest",
    "BulkAddItemsRequest",
    "BulkAddItemsResult",
    "BulkItemError",
    # Favorites
    "FavoriteCard",
    "FavoriteCheckResult",
    # Artists
    "ArtistList",
    "ArtistPreviewCard",
    # Blog
    "BlogPost",
    "BlogAuthor",
    "BlogPostMedia",
]
