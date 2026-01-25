#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Generating all SDKs from OpenAPI spec..."

# TypeScript
if [ -f "$ROOT_DIR/packages/typescript/package.json" ]; then
  echo "Generating TypeScript SDK..."
  pnpm --filter @pokeforge/sdk generate
fi

# Python
if [ -f "$ROOT_DIR/packages/python/pyproject.toml" ]; then
  echo "Generating Python SDK..."
  cd "$ROOT_DIR/packages/python"
  # Add Python generation command here
fi

# C#
if [ -f "$ROOT_DIR/packages/csharp/PokeForge.SDK.sln" ]; then
  echo "Generating C# SDK..."
  cd "$ROOT_DIR/packages/csharp"
  # Add C# generation command here
fi

echo "Done!"
