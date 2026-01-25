"""Pagination models."""

from pydantic import BaseModel, Field


class PaginationInfo(BaseModel):
    """Pagination information for list responses."""

    page: int = Field(default=1)
    page_size: int = Field(default=20, alias="pageSize")
    total_count: int = Field(default=0, alias="totalCount")
    total_pages: int = Field(default=1, alias="totalPages")
    has_next: bool = Field(default=False, alias="hasNext")
    has_previous: bool = Field(default=False, alias="hasPrevious")

    model_config = {"populate_by_name": True}
