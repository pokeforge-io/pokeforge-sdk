# OpenAPI Specification

This folder contains the OpenAPI specification synced from the PokeForge API.

## File

- `openapi.json` - The OpenAPI 3.x specification for the PokeForge API

## Syncing

The specification is automatically synced from the `pokeforge-io` repository via GitHub Actions. No manual sync is required.

## Validation

To validate the specification:

```bash
pnpm validate-spec
```

## SDK Generation

SDKs are generated from this specification. When the spec changes, regenerate the SDKs:

```bash
pnpm generate
```
