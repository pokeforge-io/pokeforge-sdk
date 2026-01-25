# PokeForge SDK for Python

Official Python SDK for the PokeForge API - TCG Collection Management & Marketplace.

## Installation

```bash
pip install pokeforge-sdk
```

Or install from source:

```bash
pip install -e packages/python
```

## Quick Start

```python
import asyncio
from pokeforge_sdk import PokeForgeClient, PokeForgeClientConfig, StaticAuth

async def main():
    # Create a client with authentication
    config = PokeForgeClientConfig(
        auth=StaticAuth(token="your-jwt-token")
    )

    async with PokeForgeClient(config) as client:
        # List cards
        page = await client.cards.list()
        for card in page.data:
            print(f"{card.name} - {card.rarity}")

        # Get a single card
        card = await client.cards.get("card-uuid")
        print(f"Got card: {card.name}")

        # Search cards
        from pokeforge_sdk.client.resources.cards import SearchCardsOptions
        results = await client.cards.search(SearchCardsOptions(q="Pikachu"))
        print(f"Found {results.pagination.total_count} cards")

asyncio.run(main())
```

## Features

- **Async/await support** - Built on `httpx` for modern async Python
- **Type hints** - Full type annotations with Pydantic models
- **Pagination** - Easy iteration through paginated results
- **Error handling** - Typed exceptions for API errors
- **Retry logic** - Automatic retries with exponential backoff

## Usage Examples

### Pagination

```python
# Iterate through all pages automatically
async for card in client.cards.list():
    print(card.name)

# Manual pagination
page = await client.cards.list()
print(f"Page {page.pagination.page} of {page.pagination.total_pages}")

# Navigate pages
if page.pagination.has_next:
    next_page = await page.next_page()

# Get all items as a list
all_cards = await page.to_list()
```

### Filtering and Sorting

```python
from pokeforge_sdk.client.resources.cards import ListCardsOptions
from pokeforge_sdk.generated.models import CardSortField, SortOrder

# Filter by set and rarity
options = ListCardsOptions(
    set_id="set-uuid",
    rarity="Rare,Holo Rare",
    sort_by=CardSortField.NAME,
    sort_order=SortOrder.ASC,
)
page = await client.cards.list(options)
```

### Collections

```python
from pokeforge_sdk.generated.models import CollectionType, CollectionVisibility

# Create a collection
collection = await client.collections.create(
    name="My Collection",
    collection_type=CollectionType.COLLECTION,
    visibility=CollectionVisibility.PRIVATE,
)

# Add a card to the collection
item = await client.collections.add_item(
    collection_id=collection.id,
    card_id="card-uuid",
    quantity=2,
)

# List collection items
items = await client.collections.list_items(collection.id)
```

### Error Handling

```python
from pokeforge_sdk import (
    NotFoundError,
    AuthenticationError,
    RateLimitError,
    ValidationError,
)

try:
    card = await client.cards.get("nonexistent-id")
except NotFoundError:
    print("Card not found")
except AuthenticationError:
    print("Invalid or expired token")
except RateLimitError as e:
    print(f"Rate limited, retry after {e.retry_after}ms")
except ValidationError as e:
    print(f"Validation errors: {e.errors}")
```

### Dynamic Authentication

```python
from pokeforge_sdk import DynamicAuth

async def get_fresh_token():
    # Fetch a fresh token from your auth service
    return "new-token"

config = PokeForgeClientConfig(
    auth=DynamicAuth(get_token=get_fresh_token)
)
```

## API Resources

The SDK provides access to all PokeForge API resources:

- **cards** - Browse and search Pokemon cards
- **sets** - Browse card sets
- **series** - Browse card series
- **collections** - Manage user collections
- **favorites** - Manage favorite cards
- **artists** - Browse card artists
- **blog** - Read blog posts

## Requirements

- Python 3.9+
- httpx >= 0.25.0
- pydantic >= 2.0.0

## Development

```bash
# Install dev dependencies
pip install -e "packages/python[dev]"

# Run tests
pytest packages/python/tests

# Type checking
mypy packages/python/pokeforge_sdk

# Linting
ruff check packages/python
```

## License

MIT
