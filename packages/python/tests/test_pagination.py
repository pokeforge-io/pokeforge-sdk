"""Tests for pagination functionality."""

import pytest
import respx
from httpx import Response

from pokeforge_sdk import PageInfo


class TestPagination:
    """Tests for pagination functionality."""

    async def test_page_info(self, client, mock_api):
        """Test page info is correctly parsed."""
        page = await client.cards.list()

        assert page.pagination.page == 1
        assert page.pagination.page_size == 20
        assert page.pagination.total_count == 100
        assert page.pagination.total_pages == 5
        assert page.pagination.has_next is True
        assert page.pagination.has_previous is False

    async def test_page_data(self, client, mock_api):
        """Test page data is correctly parsed."""
        page = await client.cards.list()

        assert len(page.data) == 3
        assert page.data[0].name == "Pikachu"
        assert page.data[1].name == "Charizard"
        assert page.data[2].name == "Bulbasaur"

    async def test_next_page(self, client, mock_api):
        """Test fetching next page."""
        # Setup mock for page 2
        mock_api.get("/Cards").mock(
            side_effect=[
                Response(
                    200,
                    json={
                        "success": True,
                        "data": [{"id": "card-1", "name": "Card 1", "setId": "set-1"}],
                        "pagination": {
                            "page": 1,
                            "pageSize": 1,
                            "totalCount": 2,
                            "totalPages": 2,
                            "hasNext": True,
                            "hasPrevious": False,
                        },
                    },
                ),
                Response(
                    200,
                    json={
                        "success": True,
                        "data": [{"id": "card-2", "name": "Card 2", "setId": "set-1"}],
                        "pagination": {
                            "page": 2,
                            "pageSize": 1,
                            "totalCount": 2,
                            "totalPages": 2,
                            "hasNext": False,
                            "hasPrevious": True,
                        },
                    },
                ),
            ]
        )

        page1 = await client.cards.list()
        assert page1.pagination.has_next is True

        page2 = await page1.next_page()
        assert page2 is not None
        assert page2.data[0].name == "Card 2"
        assert page2.pagination.page == 2

    async def test_next_page_when_none(self, client, mock_api):
        """Test next_page returns None when no more pages."""
        mock_api.get("/Cards").mock(
            return_value=Response(
                200,
                json={
                    "success": True,
                    "data": [{"id": "card-1", "name": "Card 1", "setId": "set-1"}],
                    "pagination": {
                        "page": 1,
                        "pageSize": 1,
                        "totalCount": 1,
                        "totalPages": 1,
                        "hasNext": False,
                        "hasPrevious": False,
                    },
                },
            )
        )

        page = await client.cards.list()
        next_page = await page.next_page()
        assert next_page is None

    async def test_async_iteration(self, client, mock_api):
        """Test async iteration through pages."""
        mock_api.get("/Cards").mock(
            side_effect=[
                Response(
                    200,
                    json={
                        "success": True,
                        "data": [{"id": "card-1", "name": "Card 1", "setId": "set-1"}],
                        "pagination": {
                            "page": 1,
                            "pageSize": 1,
                            "totalCount": 2,
                            "totalPages": 2,
                            "hasNext": True,
                            "hasPrevious": False,
                        },
                    },
                ),
                Response(
                    200,
                    json={
                        "success": True,
                        "data": [{"id": "card-2", "name": "Card 2", "setId": "set-1"}],
                        "pagination": {
                            "page": 2,
                            "pageSize": 1,
                            "totalCount": 2,
                            "totalPages": 2,
                            "hasNext": False,
                            "hasPrevious": True,
                        },
                    },
                ),
            ]
        )

        cards = []
        page = await client.cards.list()
        async for card in page:
            cards.append(card)

        assert len(cards) == 2
        assert cards[0].name == "Card 1"
        assert cards[1].name == "Card 2"

    async def test_to_list(self, client, mock_api):
        """Test converting all pages to list."""
        mock_api.get("/Cards").mock(
            side_effect=[
                Response(
                    200,
                    json={
                        "success": True,
                        "data": [{"id": "card-1", "name": "Card 1", "setId": "set-1"}],
                        "pagination": {
                            "page": 1,
                            "pageSize": 1,
                            "totalCount": 2,
                            "totalPages": 2,
                            "hasNext": True,
                            "hasPrevious": False,
                        },
                    },
                ),
                Response(
                    200,
                    json={
                        "success": True,
                        "data": [{"id": "card-2", "name": "Card 2", "setId": "set-1"}],
                        "pagination": {
                            "page": 2,
                            "pageSize": 1,
                            "totalCount": 2,
                            "totalPages": 2,
                            "hasNext": False,
                            "hasPrevious": True,
                        },
                    },
                ),
            ]
        )

        page = await client.cards.list()
        all_cards = await page.to_list()

        assert len(all_cards) == 2
        assert all_cards[0].name == "Card 1"
        assert all_cards[1].name == "Card 2"

    async def test_go_to_page(self, client, mock_api):
        """Test going to a specific page."""
        mock_api.get("/Cards").mock(
            side_effect=[
                Response(
                    200,
                    json={
                        "success": True,
                        "data": [{"id": "card-1", "name": "Card 1", "setId": "set-1"}],
                        "pagination": {
                            "page": 1,
                            "pageSize": 1,
                            "totalCount": 3,
                            "totalPages": 3,
                            "hasNext": True,
                            "hasPrevious": False,
                        },
                    },
                ),
                Response(
                    200,
                    json={
                        "success": True,
                        "data": [{"id": "card-3", "name": "Card 3", "setId": "set-1"}],
                        "pagination": {
                            "page": 3,
                            "pageSize": 1,
                            "totalCount": 3,
                            "totalPages": 3,
                            "hasNext": False,
                            "hasPrevious": True,
                        },
                    },
                ),
            ]
        )

        page1 = await client.cards.list()
        page3 = await page1.go_to_page(3)

        assert page3.pagination.page == 3
        assert page3.data[0].name == "Card 3"
