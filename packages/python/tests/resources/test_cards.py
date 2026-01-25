"""Tests for CardsResource."""

import pytest
import respx
from httpx import Response

from pokeforge_sdk.client.resources.cards import ListCardsOptions, SearchCardsOptions
from pokeforge_sdk.generated.models import CardSortField, SortOrder


class TestCardsResource:
    """Tests for CardsResource."""

    async def test_list_cards(self, client, mock_api):
        """Test listing cards returns paginated results."""
        page = await client.cards.list()

        assert len(page.data) == 3
        assert page.pagination.page == 1
        assert page.pagination.has_next is True
        assert page.data[0].name == "Pikachu"

    async def test_list_cards_with_filters(self, client, mock_api):
        """Test listing cards with filter options."""
        options = ListCardsOptions(rarity="Rare", set_id="set-1")
        page = await client.cards.list(options)

        # Verify the request was made with correct params
        last_request = mock_api.calls.last.request
        assert "rarity=Rare" in str(last_request.url)
        assert "setId=set-1" in str(last_request.url)

    async def test_list_cards_with_sorting(self, client, mock_api):
        """Test listing cards with sorting options."""
        options = ListCardsOptions(
            sort_by=CardSortField.NAME,
            sort_order=SortOrder.DESC,
        )
        page = await client.cards.list(options)

        last_request = mock_api.calls.last.request
        assert "sortBy=Name" in str(last_request.url)
        assert "sortOrder=Desc" in str(last_request.url)

    async def test_get_card(self, client, mock_api):
        """Test getting a single card by ID."""
        card = await client.cards.get("card-123")

        assert card.id == "card-123"
        assert card.name == "Pikachu"
        assert card.hp == 60
        assert card.set is not None
        assert card.set.name == "Base Set"

    async def test_get_card_not_found(self, client, mock_api):
        """Test getting a non-existent card raises NotFoundError."""
        from pokeforge_sdk import NotFoundError

        with pytest.raises(NotFoundError) as exc_info:
            await client.cards.get("not-found")

        assert exc_info.value.status == 404

    async def test_search_cards(self, client, mock_api):
        """Test searching cards."""
        options = SearchCardsOptions(q="Pikachu")
        page = await client.cards.search(options)

        assert len(page.data) == 1
        assert page.data[0].name == "Pikachu"

    async def test_get_variants(self, client, mock_api):
        """Test getting card variants."""
        variants = await client.cards.get_variants("card-123")

        assert len(variants) == 2
        assert variants[0].variant_type_name == "Normal"
        assert variants[1].variant_type_name == "Reverse Holo"

    async def test_get_filters(self, client, mock_api):
        """Test getting available filters."""
        filters = await client.cards.get_filters()

        assert "Common" in filters.rarities
        assert "Pokemon" in filters.supertypes
        assert "Fire" in filters.types

    async def test_record_view(self, client, mock_api):
        """Test recording a card view."""
        # Should not raise
        await client.cards.record_view("card-123")

    async def test_list_all(self, client, mock_api):
        """Test list_all convenience method."""
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
        async for card in client.cards.list_all():
            cards.append(card)

        assert len(cards) == 2


class TestSetsResource:
    """Tests for SetsResource."""

    async def test_list_sets(self, client, mock_api):
        """Test listing sets."""
        page = await client.sets.list()

        assert len(page.data) == 1
        assert page.data[0].name == "Base Set"

    async def test_get_set(self, client, mock_api):
        """Test getting a single set."""
        set_detail = await client.sets.get("set-1")

        assert set_detail.id == "set-1"
        assert set_detail.name == "Base Set"
        assert set_detail.series is not None
        assert set_detail.series.name == "Base"

    async def test_get_set_by_slug(self, client, mock_api):
        """Test getting a set by slug."""
        set_detail = await client.sets.get_by_slug("base-set")

        assert set_detail.name == "Base Set"


class TestSeriesResource:
    """Tests for SeriesResource."""

    async def test_list_series(self, client, mock_api):
        """Test listing series."""
        page = await client.series.list()

        assert len(page.data) == 1
        assert page.data[0].name == "Base"

    async def test_get_series(self, client, mock_api):
        """Test getting a single series."""
        series_detail = await client.series.get("series-1")

        assert series_detail.id == "series-1"
        assert series_detail.name == "Base"
