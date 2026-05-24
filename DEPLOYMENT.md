# 🚀 Guía de Deployment: QueVeo en Railway

## Descripción General

QueVeo es una aplicación fullstack construida con:
- **Frontend/Backend:** TanStack Start (fullstack React framework)
- **Build tool:** Vite
- **Runtime:** Node.js 22
- **Database:** Supabase
- **Build system:** NIXPACKS

## Requisitos Previos

1. **GitHub:** El repositorio conectado a Railway
2. **Supabase:** Una instancia configurada con:
   - URL del proyecto
   - Anon key (publishable)
   - Project ID
3. **Railway:** Cuenta creada en https://railway.app

## Paso 1: Preparar Variables de Entorno

El proyecto requiere estas variables en Supabase:

```
# Variables de Supabase (obtener de https://supabase.com/dashboard)
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=<tu-project-id>
```

**Nota sobre Railway:** El puerto se inyecta automáticamente como `PORT`, no necesita configurarlo manualmente.

## Paso 2: Crear Proyecto en Railway

1. Ir a https://railway.app
2. Click en "New Project" → "Deploy from GitHub repo"
3. Seleccionar el repositorio `amihanovich/que_veo`
4. Railway detectará automáticamente la configuración con `nixpacks.toml`

## Paso 3: Configurar Variables de Entorno en Railway

1. En el dashboard de Railway, ir a "Variables"
2. Agregar las variables de Supabase:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

## Paso 4: Deploy Automático

Railway está configurado para:
- **Build:** `npm run build` (genera `.output/server/index.mjs`)
- **Start:** `node .output/server/index.mjs`
- **Restart policy:** ON_FAILURE con máximo 3 reintentos

El deploy se ejecutará automáticamente al hacer push a la rama principal o cuando se actualice la rama conectada.

## Monitoreo

- **Logs:** Ver en tiempo real en Railway dashboard
- **Health:** Railway verificará que el servidor responda en el puerto asignado
- **Rollback:** Railway permite revertir a deployments anteriores

## Solución de Problemas

### Build falla
- Verificar que `npm install --legacy-peer-deps` funciona localmente
- Revisar logs en Railway dashboard

### Servidor no inicia
- Verificar variables de entorno están configuradas
- Revisar logs: `node .output/server/index.mjs`

### Problemas con Supabase
- Verificar que las claves de Supabase son correctas
- Verificar CORS en Supabase para el dominio de Railway

## Links Útiles

- [Railway Docs](https://docs.railway.app/)
- [TanStack Start Docs](https://tanstack.com/start/latest)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev/)
