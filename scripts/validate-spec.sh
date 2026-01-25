#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Validating OpenAPI spec..."

npx @openapitools/openapi-generator-cli validate -i "$ROOT_DIR/openapi/openapi.json"

echo "Validation complete!"
