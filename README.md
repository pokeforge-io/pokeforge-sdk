# PokeForge SDK

Official SDKs for the PokeForge API.

## Packages

| Package | Language | Registry | Status |
|---------|----------|----------|--------|
| [@pokeforge/sdk](./packages/typescript) | TypeScript/JavaScript | npm | Coming Soon |
| [pokeforge-sdk](./packages/python) | Python | PyPI | Coming Soon |
| [PokeForge.SDK](./packages/csharp) | C# | NuGet | Coming Soon |

## Quick Start

### TypeScript

```bash
npm install @pokeforge/sdk
```

```typescript
import { PokeForgeClient } from '@pokeforge/sdk';

const client = new PokeForgeClient({
  auth: { token: 'your-api-token' }
});

const cards = await client.cards.list({ rarity: ['Rare'] });
```

### Python

```bash
pip install pokeforge-sdk
```

```python
from pokeforge_sdk import PokeForgeClient

client = PokeForgeClient(auth_token='your-api-token')

cards = await client.cards.list(rarity=['Rare'])
```

### C#

```bash
dotnet add package PokeForge.SDK
```

```csharp
using PokeForge.SDK;

var client = new PokeForgeClient(new PokeForgeClientOptions
{
    AuthToken = "your-api-token"
});

var cards = await client.Cards.ListAsync();
```

## Development

This is a pnpm workspace monorepo.

### Prerequisites

- Node.js 18+
- pnpm 8+
- Python 3.9+ (for Python SDK)
- .NET 8+ (for C# SDK)

### Setup

```bash
pnpm install
```

### Commands

```bash
# Build all packages
pnpm build

# Run all tests
pnpm test

# Generate SDKs from OpenAPI spec
pnpm generate

# Validate OpenAPI spec
pnpm validate-spec
```

## Repository Structure

```
pokeforge-sdk/
├── openapi/              # OpenAPI specification (synced from API)
├── packages/
│   ├── typescript/       # TypeScript/JavaScript SDK
│   ├── python/           # Python SDK
│   └── csharp/           # C# SDK
├── scripts/              # Build and generation scripts
└── docs/                 # Documentation (coming soon)
```

## License

MIT
