"""Tests for the main PokeForgeClient."""

import pytest

from pokeforge_sdk import PokeForgeClient, PokeForgeClientConfig, StaticAuth


class TestPokeForgeClient:
    """Tests for PokeForgeClient."""

    async def test_client_initialization(self, mock_api):
        """Test client initializes with default config."""
        config = PokeForgeClientConfig()
        async with PokeForgeClient(config) as client:
            assert client.cards is not None
            assert client.sets is not None
            assert client.series is not None
            assert client.collections is not None
            assert client.favorites is not None
            assert client.artists is not None
            assert client.blog is not None

    async def test_client_with_auth(self, mock_api):
        """Test client with authentication."""
        config = PokeForgeClientConfig(
            base_url="https://api.pokeforge.gg",
            auth=StaticAuth(token="test-token"),
        )
        async with PokeForgeClient(config) as client:
            # Should be able to make requests
            await client.health()

    async def test_health_check(self, client):
        """Test health check endpoint."""
        # Should not raise
        await client.health()

    async def test_with_config(self, mock_api):
        """Test creating new client with updated config."""
        config = PokeForgeClientConfig(
            base_url="https://api.pokeforge.gg",
        )
        async with PokeForgeClient(config) as client:
            new_client = client.with_config(auth=StaticAuth(token="new-token"))
            assert new_client is not client
