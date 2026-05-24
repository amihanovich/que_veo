#!/bin/bash

# QueVeo Setup Script
# Este script prepara tu entorno local para desarrollo y deployment

set -e

echo "🎬 Bienvenido a QueVeo Setup"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado. Por favor instálalo desde https://nodejs.org${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Install dependencies
echo ""
echo "📦 Instalando dependencias..."
npm install
echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# Setup .env.local
echo ""
echo "⚙️  Configurando variables de entorno..."

if [ -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local ya existe${NC}"
    read -p "¿Quieres sobrescribirlo? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Usando .env.local existente"
        exit 0
    fi
fi

cp .env.example .env.local
echo -e "${GREEN}✓ Archivo .env.local creado desde .env.example${NC}"

echo ""
echo -e "${YELLOW}📝 PRÓXIMO PASO: Edita .env.local con tus credenciales de Supabase${NC}"
echo ""
echo "Instrucciones:"
echo "1. Ve a https://app.supabase.com"
echo "2. Crea un nuevo proyecto o abre uno existente"
echo "3. En Settings > API, copia:"
echo "   - Project URL → SUPABASE_URL"
echo "   - Anon Public Key → SUPABASE_PUBLISHABLE_KEY"
echo ""
echo "4. Edita .env.local:"
if command -v code &> /dev/null; then
    read -p "¿Abrir VS Code para editar? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        code .env.local
    fi
fi

echo ""
echo -e "${GREEN}✅ Setup completado!${NC}"
echo ""
echo "Para empezar a desarrollar:"
echo "  npm run dev"
echo ""
echo "Para desplegar en Railway:"
echo "  Revisa DEPLOYMENT.md"
