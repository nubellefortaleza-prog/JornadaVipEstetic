#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH="main"

echo "==> Atualizando código..."
git -C "$PROJECT_DIR" pull origin "$BRANCH"

echo "==> Gerando build..."
npm --prefix "$PROJECT_DIR" run build

echo "==> Reiniciando app..."
pm2 restart all

echo "==> Deploy concluído!"
