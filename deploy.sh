#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$PROJECT_DIR/dist"

echo "==> Atualizando código..."
git -C "$PROJECT_DIR" pull origin main

echo "==> Instalando dependências..."
npm --prefix "$PROJECT_DIR" install

echo "==> Gerando build..."
npm --prefix "$PROJECT_DIR" run build

echo "==> Deploy concluído! Arquivos em: $DIST_DIR"
echo "Lembre-se: o nginx deve apontar para $DIST_DIR"
