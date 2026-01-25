"""Blog models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class BlogAuthor(BaseModel):
    """Author information for blog posts."""

    id: Optional[str] = None
    name: Optional[str] = None

    model_config = {"populate_by_name": True}


class BlogPostMedia(BaseModel):
    """Media attachment for blog posts."""

    id: str
    media_type: Optional[str] = Field(default=None, alias="mediaType")
    url: Optional[str] = None
    caption: Optional[str] = None
    sort_order: int = Field(default=0, alias="sortOrder")

    model_config = {"populate_by_name": True}


class BlogPost(BaseModel):
    """Blog post."""

    id: str
    actor_type: Optional[str] = Field(default=None, alias="actorType")
    author: Optional[BlogAuthor] = None
    title: Optional[str] = None
    content: Optional[str] = None
    content_type: Optional[str] = Field(default=None, alias="contentType")
    excerpt: Optional[str] = None
    category: Optional[str] = None
    is_pinned: bool = Field(default=False, alias="isPinned")
    is_featured: bool = Field(default=False, alias="isFeatured")
    published_at: Optional[datetime] = Field(default=None, alias="publishedAt")
    likes_count: int = Field(default=0, alias="likesCount")
    comments_count: int = Field(default=0, alias="commentsCount")
    media: Optional[list[BlogPostMedia]] = None

    model_config = {"populate_by_name": True}
