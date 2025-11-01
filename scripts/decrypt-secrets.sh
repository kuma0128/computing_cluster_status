#!/bin/bash
# Decrypt secrets for local development or deployment
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SECRETS_DIR="${PROJECT_ROOT}/secrets"

echo "==> Decrypting secrets..."

# Check if sops is installed
if ! command -v sops &> /dev/null; then
    echo "ERROR: sops is not installed"
    echo "Install with: brew install sops (macOS) or download from https://github.com/mozilla/sops/releases"
    exit 1
fi

# Check if SOPS_AGE_KEY or SOPS_AGE_KEY_FILE is set
if [ -z "${SOPS_AGE_KEY:-}" ] && [ -z "${SOPS_AGE_KEY_FILE:-}" ]; then
    echo "ERROR: SOPS_AGE_KEY or SOPS_AGE_KEY_FILE environment variable is not set"
    echo "Set it with:"
    echo "  export SOPS_AGE_KEY_FILE=/path/to/age-key.txt"
    echo "  or"
    echo "  export SOPS_AGE_KEY='AGE-SECRET-KEY-...'"
    exit 1
fi

# Decrypt .env file
if [ -f "${SECRETS_DIR}/.env.enc" ]; then
    echo "Decrypting .env..."
    sops -d "${SECRETS_DIR}/.env.enc" > "${PROJECT_ROOT}/.env"
    echo "✓ .env decrypted"
else
    echo "WARNING: ${SECRETS_DIR}/.env.enc not found"
fi

# Decrypt other secret files
for file in "${SECRETS_DIR}"/*.enc; do
    if [ -f "$file" ] && [ "$file" != "${SECRETS_DIR}/.env.enc" ]; then
        filename=$(basename "$file" .enc)
        echo "Decrypting ${filename}..."
        sops -d "$file" > "${SECRETS_DIR}/${filename}"
        echo "✓ ${filename} decrypted"
    fi
done

echo "==> Secrets decrypted successfully!"
echo ""
echo "IMPORTANT: Decrypted files are in .gitignore and will not be committed."
