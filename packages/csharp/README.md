# PokeForge SDK for .NET

Official .NET SDK for the PokeForge API.

## Installation

```bash
dotnet add package PokeForge.SDK
```

## Quick Start

```csharp
using PokeForge.SDK.Client;

// Create a client (no auth required for public endpoints)
using var client = new PokeForgeClient();

// List cards with pagination
var page = await client.Cards.ListAsync(new ListCardsOptions
{
    Rarity = "Rare",
    Search = "Pikachu"
});

Console.WriteLine($"Found {page.Pagination.TotalCount} cards");

// Iterate through all matching cards (auto-pagination)
await foreach (var card in client.Cards.ListAllAsync())
{
    Console.WriteLine($"{card.Name} - {card.Rarity}");
}
```

## Features

- Full async/await support with `CancellationToken`
- `IAsyncEnumerable<T>` for streaming pagination across all pages
- Automatic retry with exponential backoff
- Typed exceptions for error handling
- Support for .NET 8.0, .NET 9.0, and .NET 10.0

## Authentication

```csharp
// Static token
using var client = new PokeForgeClient(new PokeForgeClientOptions
{
    AuthToken = "your-jwt-token"
});

// Dynamic token provider (for token refresh scenarios)
using var client = new PokeForgeClient(new PokeForgeClientOptions
{
    TokenProvider = async ct => await GetFreshTokenAsync(ct)
});
```

## Configuration

```csharp
using var client = new PokeForgeClient(new PokeForgeClientOptions
{
    BaseUrl = "https://api.pokeforge.gg",  // Default
    AuthToken = "your-jwt-token",
    Timeout = TimeSpan.FromSeconds(30),    // Default
    MaxRetries = 3,                         // Default
    RetryDelay = new RetryDelayOptions
    {
        BaseDelay = TimeSpan.FromSeconds(1),  // Default
        MaxDelay = TimeSpan.FromSeconds(30),  // Default
        Exponential = true                     // Default
    }
});
```

## Resources

### Cards

```csharp
// List cards with filtering
var page = await client.Cards.ListAsync(new ListCardsOptions
{
    SetId = setId,
    Rarity = "Rare",
    Supertype = "Pokemon",
    Search = "Pikachu",
    SortBy = "name",
    SortOrder = "asc"
});

// Get single card
var card = await client.Cards.GetAsync(cardId);

// Search cards
var results = await client.Cards.SearchAsync(new SearchCardsOptions { Query = "Pikachu" });

// Get card variants
var variants = await client.Cards.GetVariantsAsync(cardId);

// Get available filters
var filters = await client.Cards.GetFiltersAsync();
```

### Sets

```csharp
var sets = await client.Sets.ListAsync(new ListSetsOptions { Search = "Base" });
var set = await client.Sets.GetAsync(setId);
```

### Series

```csharp
var series = await client.Series.ListAsync();
var seriesDetail = await client.Series.GetAsync(seriesId);
```

### Collections (requires auth)

```csharp
// List user's collections
var collections = await client.Collections.ListAsync();

// Get collection details
var collection = await client.Collections.GetAsync(collectionId);

// Create a collection
var newCollection = await client.Collections.CreateAsync(new CreateCollectionRequest
{
    Name = "My Favorites",
    Description = "Cards I want to collect",
    Visibility = "Private"
});

// Add card to collection
await client.Collections.AddItemAsync(collectionId, new AddCollectionItemRequest
{
    CardId = cardId,
    Quantity = 1,
    Condition = "NearMint"
});
```

### Favorites (requires auth)

```csharp
// List favorites
var favorites = await client.Favorites.ListAsync();

// Add to favorites
await client.Favorites.AddAsync(cardId);

// Remove from favorites
await client.Favorites.RemoveAsync(cardId);
```

### Artists

```csharp
var artists = await client.Artists.ListAsync(new ListArtistsOptions { Search = "Mitsuhiro" });
```

### Blog

```csharp
var posts = await client.Blog.ListAsync(new ListBlogPostsOptions { Category = "News" });
var post = await client.Blog.GetAsync(postId);
```

## Pagination

All list operations return a `Page<T>` that supports:

```csharp
// Get page data
foreach (var card in page.Data)
{
    Console.WriteLine(card.Name);
}

// Check pagination info
Console.WriteLine($"Page {page.Pagination.Page} of {page.Pagination.TotalPages}");

// Navigate pages
var nextPage = await page.NextPageAsync();
var prevPage = await page.PreviousPageAsync();
var page3 = await page.GoToPageAsync(3);

// Collect all items
var allCards = await page.ToListAsync();

// Async enumeration (auto-fetches all pages)
await foreach (var card in page)
{
    Console.WriteLine(card.Name);
}
```

## Error Handling

```csharp
using PokeForge.SDK.Exceptions;

try
{
    var card = await client.Cards.GetAsync(invalidId);
}
catch (NotFoundException ex)
{
    Console.WriteLine($"Card not found: {ex.Message}");
}
catch (AuthenticationException ex)
{
    Console.WriteLine($"Auth failed: {ex.Message}");
}
catch (RateLimitException ex)
{
    Console.WriteLine($"Rate limited. Retry after: {ex.RetryAfterMs}ms");
}
catch (ValidationException ex)
{
    Console.WriteLine($"Validation failed: {ex.Message}");
    foreach (var (field, errors) in ex.Errors ?? new Dictionary<string, string[]>())
    {
        Console.WriteLine($"  {field}: {string.Join(", ", errors)}");
    }
}
catch (PokeForgeTimeoutException)
{
    Console.WriteLine("Request timed out");
}
catch (NetworkException ex)
{
    Console.WriteLine($"Network error: {ex.Message}");
}
catch (PokeForgeException ex)
{
    Console.WriteLine($"API error {ex.StatusCode}: {ex.Message}");
}
```

## License

MIT
