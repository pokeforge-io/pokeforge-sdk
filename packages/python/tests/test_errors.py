"""Tests for error handling."""

import pytest
import respx
from httpx import Response

from pokeforge_sdk import (
    AuthenticationError,
    ForbiddenError,
    NotFoundError,
    PokeForgeError,
    RateLimitError,
    ValidationError,
)


class TestErrorHandling:
    """Tests for error handling."""

    async def test_not_found_error(self, client, mock_api):
        """Test 404 raises NotFoundError."""
        with pytest.raises(NotFoundError) as exc_info:
            await client.cards.get("not-found")

        assert exc_info.value.status == 404

    async def test_authentication_error(self, client, mock_api):
        """Test 401 raises AuthenticationError."""
        mock_api.get("/Cards").mock(
            return_value=Response(
                401,
                json={
                    "title": "Unauthorized",
                    "status": 401,
                    "detail": "Invalid or expired token",
                },
            )
        )

        with pytest.raises(AuthenticationError) as exc_info:
            await client.cards.list()

        assert exc_info.value.status == 401

    async def test_forbidden_error(self, client, mock_api):
        """Test 403 raises ForbiddenError."""
        mock_api.get("/Cards").mock(
            return_value=Response(
                403,
                json={
                    "title": "Forbidden",
                    "status": 403,
                    "detail": "Access denied",
                },
            )
        )

        with pytest.raises(ForbiddenError) as exc_info:
            await client.cards.list()

        assert exc_info.value.status == 403

    async def test_rate_limit_error(self, client, mock_api):
        """Test 429 raises RateLimitError."""
        mock_api.get("/Cards").mock(
            return_value=Response(
                429,
                json={
                    "title": "Rate Limit Exceeded",
                    "status": 429,
                },
                headers={"Retry-After": "60"},
            )
        )

        with pytest.raises(RateLimitError) as exc_info:
            await client.cards.list()

        assert exc_info.value.status == 429
        assert exc_info.value.retry_after == 60000

    async def test_validation_error(self, client, mock_api):
        """Test 400 raises ValidationError."""
        mock_api.get("/Cards").mock(
            return_value=Response(
                400,
                json={
                    "title": "Bad Request",
                    "status": 400,
                    "detail": "Invalid query parameters",
                    "errors": {"rarity": ["Invalid rarity value"]},
                },
            )
        )

        with pytest.raises(ValidationError) as exc_info:
            await client.cards.list()

        assert exc_info.value.status == 400
        assert exc_info.value.errors is not None
        assert "rarity" in exc_info.value.errors

    async def test_generic_server_error(self, client, mock_api):
        """Test 500 raises PokeForgeError."""
        mock_api.get("/Cards").mock(
            return_value=Response(
                500,
                json={
                    "title": "Internal Server Error",
                    "status": 500,
                },
            )
        )

        with pytest.raises(PokeForgeError) as exc_info:
            await client.cards.list()

        assert exc_info.value.status == 500


class TestErrorFactory:
    """Tests for error factory method."""

    def test_from_response_not_found(self):
        """Test factory creates NotFoundError for 404."""
        error = PokeForgeError.from_response(404, {"title": "Not Found"})
        assert isinstance(error, NotFoundError)
        assert error.status == 404

    def test_from_response_authentication(self):
        """Test factory creates AuthenticationError for 401."""
        error = PokeForgeError.from_response(401, {"title": "Unauthorized"})
        assert isinstance(error, AuthenticationError)
        assert error.status == 401

    def test_from_response_unknown_status(self):
        """Test factory creates base error for unknown status."""
        error = PokeForgeError.from_response(418, {"title": "I'm a teapot"})
        assert type(error) is PokeForgeError
        assert error.status == 418
