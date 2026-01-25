"""Blog resource."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, AsyncIterator, Optional

from pokeforge_sdk.client.pagination import Page
from pokeforge_sdk.client.resources.base import BaseResource
from pokeforge_sdk.generated.models import BlogPost

if TYPE_CHECKING:
    from pokeforge_sdk.client.http import HttpClient


@dataclass
class ListBlogPostsOptions:
    """Options for listing blog posts."""

    page: int = 1
    limit: int = 20
    category: Optional[str] = None


class BlogResource(BaseResource):
    """Blog API - browse published blog posts."""

    def __init__(self, http: HttpClient) -> None:
        super().__init__(http)

    async def list(
        self, options: Optional[ListBlogPostsOptions] = None
    ) -> Page[BlogPost]:
        """
        Get a paginated list of published blog posts.

        Example:
            page = await client.blog.list()
            async for post in page:
                print(post.title)
        """
        opts = options or ListBlogPostsOptions()
        query = self._build_query(
            page=opts.page,
            limit=opts.limit,
            category=opts.category,
        )

        response = await self._http.get("/Blog", query)

        async def fetcher(page: int, page_size: int) -> Page[BlogPost]:
            new_opts = ListBlogPostsOptions(
                page=page,
                limit=page_size,
                category=opts.category,
            )
            return await self.list(new_opts)

        return self._create_paged_response(response, BlogPost, fetcher)

    async def get(self, id: str) -> BlogPost:
        """
        Get a single blog post by ID.

        Args:
            id: The blog post GUID
        """
        response = await self._http.get(f"/Blog/{id}")

        if not response or not response.get("data"):
            from pokeforge_sdk.client.errors import NotFoundError

            raise NotFoundError("Blog post not found")

        return BlogPost.model_validate(response["data"])

    async def list_all(
        self, options: Optional[ListBlogPostsOptions] = None
    ) -> AsyncIterator[BlogPost]:
        """
        Convenience method to iterate through all blog posts.

        Example:
            async for post in client.blog.list_all():
                print(post.title)
        """
        opts = options or ListBlogPostsOptions()
        opts.page = 1
        page = await self.list(opts)
        async for post in page:
            yield post
