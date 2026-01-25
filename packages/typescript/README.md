# @pokeforge/sdk

Official PokeForge API SDK for TypeScript and JavaScript.

## Installation

```bash
# npm
npm install @pokeforge/sdk

# pnpm
pnpm add @pokeforge/sdk

# yarn
yarn add @pokeforge/sdk
```

## Quick Start

```typescript
import { PokeForgeClient } from "@pokeforge/sdk";

const client = new PokeForgeClient({
  authToken: "your-jwt-token",
});

// List cards
const cards = await client.cards.list({ rarity: ["Rare"] });

// Get a specific card
const card = await client.cards.get("card-id");

// Iterate through all cards
for await (const card of client.cards.listAll({ search: "Pikachu" })) {
  console.log(card.name);
}
```

## Requirements

- Node.js 18 or later
- TypeScript 5.0+ (if using TypeScript)

## Features

- Full TypeScript support with auto-generated types
- Async iterators for pagination
- Automatic token refresh
- Comprehensive error handling

## Documentation

For full documentation, visit [docs.pokeforge.io](https://docs.pokeforge.io).

## License

MIT
