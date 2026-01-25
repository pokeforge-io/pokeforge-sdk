"""Pytest fixtures and test configuration."""

import pytest
import respx
from httpx import Response

from pokeforge_sdk import PokeForgeClient, PokeForgeClientConfig, StaticAuth

BASE_URL = "https://api.pokeforge.gg"

# Mock data
MOCK_CARD = {
    "id": "card-123",
    "name": "Pikachu",
    "number": "25",
    "setId": "set-1",
    "setName": "Base Set",
    "supertype": "Pokemon",
    "subtypes": ["Basic"],
    "rarity": "Rare",
    "types": ["Lightning"],
    "imageUrlStandard": "https://example.com/pikachu.png",
    "artistName": "Ken Sugimori",
}

MOCK_CARD_DETAIL = {
    **MOCK_CARD,
    "hp": 60,
    "evolvesFrom": None,
    "flavorText": "When several of these Pokemon gather, their electricity could build and cause lightning storms.",
    "attacks": '[{"name": "Thunder Shock", "damage": "10"}]',
    "abilities": None,
    "weaknesses": '[{"type": "Fighting", "value": "x2"}]',
    "resistances": None,
    "retreatCost": 1,
    "set": {
        "id": "set-1",
        "name": "Base Set",
        "slug": "base-set",
    },
}

MOCK_CARDS = [
    MOCK_CARD,
    {
        "id": "card-456",
        "name": "Charizard",
        "number": "4",
        "setId": "set-1",
        "setName": "Base Set",
        "supertype": "Pokemon",
        "subtypes": ["Stage 2"],
        "rarity": "Holo Rare",
        "types": ["Fire"],
        "imageUrlStandard": "https://example.com/charizard.png",
        "artistName": "Mitsuhiro Arita",
    },
    {
        "id": "card-789",
        "name": "Bulbasaur",
        "number": "44",
        "setId": "set-1",
        "setName": "Base Set",
        "supertype": "Pokemon",
        "subtypes": ["Basic"],
        "rarity": "Common",
        "types": ["Grass"],
        "imageUrlStandard": "https://example.com/bulbasaur.png",
        "artistName": "Ken Sugimori",
    },
]

MOCK_PAGINATION = {
    "page": 1,
    "pageSize": 20,
    "totalCount": 100,
    "totalPages": 5,
    "hasNext": True,
    "hasPrevious": False,
}

MOCK_SET = {
    "id": "set-1",
    "name": "Base Set",
    "slug": "base-set",
    "seriesId": "series-1",
    "seriesName": "Base",
    "releaseDate": "1999-01-09T00:00:00Z",
    "totalCards": 102,
    "logoUrl": "https://example.com/base-set-logo.png",
    "symbolUrl": "https://example.com/base-set-symbol.png",
}

MOCK_SERIES = {
    "id": "series-1",
    "name": "Base",
    "slug": "base",
    "totalSets": 5,
    "totalCards": 500,
}


@pytest.fixture
def mock_api():
    """Setup respx mock for API calls."""
    with respx.mock(base_url=BASE_URL, assert_all_called=False) as respx_mock:
        # Health check
        respx_mock.get("/health").mock(
            return_value=Response(200, json={"status": "healthy"})
        )

        # Cards endpoints
        respx_mock.get("/Cards").mock(
            return_value=Response(
                200,
                json={
                    "success": True,
                    "data": MOCK_CARDS,
                    "pagination": MOCK_PAGINATION,
                },
            )
        )

        respx_mock.get("/Cards/card-123").mock(
            return_value=Response(
                200,
                json={
                    "success": True,
                    "data": MOCK_CARD_DETAIL,
                },
            )
        )

        respx_mock.get("/Cards/not-found").mock(
            return_value=Response(
                404,
                json={
                    "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                    "title": "Not Found",
                    "status": 404,
                    "detail": "Card not found",
                },
            )
        )

        respx_mock.get("/Cards/search").mock(
            return_value=Response(
                200,
                json={
                    "success": True,
                    "data": [MOCK_CARDS[0]],
                    "pagination": {**MOCK_PAGINATION, "totalCount": 1, "totalPages": 1, "hasNext": False},
                },
            )
        )

        respx_mock.get("/Cards/card-123/variants").mock(
            return_value=Response(
                200,
                json={
                    "variants": [
                        {"id": "card-123", "variantTypeCode": "N", "variantTypeName": "Normal"},
                        {"id": "card-123-rh", "variantTypeCode": "RH", "variantTypeName": "Reverse Holo"},
                    ]
                },
            )
        )

        respx_mock.get("/Cards/filters").mock(
            return_value=Response(
                200,
                json={
                    "success": True,
                    "data": {
                        "rarities": ["Common", "Uncommon", "Rare", "Holo Rare"],
                        "supertypes": ["Pokemon", "Trainer", "Energy"],
                        "subtypes": ["Basic", "Stage 1", "Stage 2"],
                        "types": ["Fire", "Water", "Grass", "Lightning"],
                    },
                },
            )
        )

        respx_mock.post("/Cards/card-123/views").mock(
            return_value=Response(204)
        )

        # Sets endpoints
        respx_mock.get("/Sets").mock(
            return_value=Response(
                200,
                json={
                    "success": True,
                    "data": [MOCK_SET],
                    "pagination": {**MOCK_PAGINATION, "totalCount": 1, "totalPages": 1, "hasNext": False},
                },
            )
        )

        respx_mock.get("/Sets/set-1").mock(
            return_value=Response(
                200,
                json={
                    "success": True,
                    "data": {**MOCK_SET, "series": {"id": "series-1", "name": "Base", "slug": "base"}},
                },
            )
        )

        respx_mock.get("/Sets/slug/base-set").mock(
            return_value=Response(
                200,
                json={
                    "success": True,
                    "data": {**MOCK_SET, "series": {"id": "series-1", "name": "Base", "slug": "base"}},
                },
            )
        )

        # Series endpoints
        respx_mock.get("/Series").mock(
            return_value=Response(
                200,
                json={
                    "success": True,
                    "data": [MOCK_SERIES],
                    "pagination": {**MOCK_PAGINATION, "totalCount": 1, "totalPages": 1, "hasNext": False},
                },
            )
        )

        respx_mock.get("/Series/series-1").mock(
            return_value=Response(
                200,
                json={
                    "success": True,
                    "data": MOCK_SERIES,
                },
            )
        )

        yield respx_mock


@pytest.fixture
async def client(mock_api):
    """Create a test client with mocked API."""
    config = PokeForgeClientConfig(
        base_url=BASE_URL,
        auth=StaticAuth(token="test-token"),
    )
    async with PokeForgeClient(config) as client:
        yield client
