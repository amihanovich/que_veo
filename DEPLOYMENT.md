# 🚀 Guía Completa de Deployment - QueVeo

## Step 1: Preparar Repositorio GitHub

### 1.1 Crear repositorio en GitHub

```bash
# Opción A: Desde línea de comandos (requiere GitHub CLI)
gh repo create queveo --public --source=. --remote=origin --push

# Opción B: Ir a github.com/new y crear manualmente
# Luego:
git init
git add .
git commit -m "Initial commit: QueVeo app"
git branch -M main
git remote add origin https://github.com/tu-usuario/queveo.git
git push -u origin main
```

### 1.2 Verificar que `.env` NO está en Git

```bash
# Verificar si .env está trackeado (MALO)
git ls-files | grep .env

# Si sí está, removerlo:
git rm --cached .env
git commit -m "Remove .env from version control"
```

## Step 2: Configurar Railway

### 2.1 Crear cuenta en Railway

1. Ir a [railway.app](https://railway.app)
2. Sign up con GitHub (recomendado)
3. Autorizar Railway para acceder a tus repositorios

### 2.2 Conectar repositorio a Railway

#### Opción A: UI de Railway (Más fácil)

1. Dashboard de Railway → "New Project"
2. Seleccionar "Deploy from GitHub"
3. Autorizar Railway
4. Seleccionar repositorio `queveo`
5. Railway detectará automáticamente:
   - `Dockerfile`
   - `railway.toml`
6. Click "Deploy"

#### Opción B: CLI de Railway

```bash
# Instalar CLI
npm install -g @railway/cli

# Autenticarse
railway login
# Se abrirá browser para autorizar

# Inicializar proyecto
cd /path/to/queveo
railway init
# Seleccionar "Link to existing project" o "Create new project"

# Desplegar
railway up
```

### 2.3 Configurar Variables de Entorno en Railway

En Railway Dashboard → Tu Proyecto → "Variables":

1. Ir a **Settings** → **Variables**
2. Agregar cada variable:

```
SUPABASE_URL=https://kdcjyeryzitarcrzpymq.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=kdcjyeryzitarcrzpymq
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://kdcjyeryzitarcrzpymq.supabase.co
NODE_ENV=production
```

⚠️ **Importante**: 
- `SUPABASE_URL` y `VITE_SUPABASE_URL` deben ser idénticas
- `SUPABASE_PUBLISHABLE_KEY` y `VITE_SUPABASE_PUBLISHABLE_KEY` deben ser idénticas

### 2.4 Configurar Port y Health Check

En **Deployment** settings:

```
Port: 3000
Health Check Path: /
Health Check Interval: 30s
```

## Step 3: Desplegar Cambios Futuros

### Opción A: Automático (Recomendado)

Una vez que conectes GitHub a Railway, **cada push a `main` dispara automáticamente un nuevo deployment**.

```bash
git add .
git commit -m "Feature: improve recommendations"
git push origin main
# ✅ Railway automaticamente despliega
```

### Opción B: Manual con CLI

```bash
railway up
```

### Opción C: Manual desde UI

Railway Dashboard → Tu Proyecto → "Deployments" → "Deploy Latest"

## Step 4: Verificar Deployment

### En Railway Dashboard:

1. **Deployments**: Ver historial y status
2. **Logs**: `View Logs` → Ver output en vivo
3. **Networking**: Obtener URL pública (ej: `https://queveo-prod.railway.app`)

### En Terminal:

```bash
# Ver logs en vivo
railway logs

# Ver status
railway status

# Obtener variables
railway env
```

### En el Navegador:

```
https://your-railway-url/
```

Debería mostrar la app funcionando.

## Troubleshooting

### ❌ Build Fallido

**Síntoma**: Error durante `npm run build`

**Solución**:
```bash
# 1. Revisar logs de Railway
railway logs

# 2. Verificar build localmente
npm run build

# 3. Si funciona localmente pero no en Railway:
   - Revisar variables de entorno
   - Asegurar que Supabase está accesible
```

### ❌ App Crashes después de Deploy

**Síntoma**: Deploy exitoso pero app no carga

**Solución**:
```bash
# 1. Revisar health check
railway logs | grep -i health

# 2. Aumentar timeout en railway.toml:
healthcheckTimeout = 30  # Cambiar de 10 a 30

# 3. Verificar que puerto 3000 está disponible
```

### ❌ Supabase Auth No Funciona

**Síntoma**: Error de autenticación en producción

**Solución**:
```
1. Railway Dashboard → Variables → Verificar:
   - SUPABASE_URL correcto
   - SUPABASE_PUBLISHABLE_KEY válida
   
2. Supabase Console → Settings → Auth:
   - Agregar URL de Railway a "Redirect URLs"
   - Ej: https://queveo-prod.railway.app/**
```

### ❌ CORS Errors

**Síntoma**: Error de CORS en console del navegador

**Solución**:
```
1. Supabase Console → Settings → API
   - Actualizar CORS settings
   - Agregar tu URL de Railway
```

## Monitoreo Post-Deployment

### 1. Configurar Notificaciones

Railway → Proyecto → Settings → Notifications:
- Email en deployment failures
- Slack (opcional)

### 2. Monitorear Logs

```bash
# En terminal, logs en vivo
railway logs -f

# O en UI de Railway
Deployments → Última → View Logs
```

### 3. Performance

Railway Dashboard → Monitoring:
- CPU usage
- Memory usage
- Request latency

## Rollback (si algo sale mal)

### Opción A: Volver a versión anterior

```bash
# Ver histórico de deployments
railway logs --since "2 hours ago"

# Hacer rollback desde UI:
Railway Dashboard → Deployments → [Deployment anterior] → "Redeploy"
```

### Opción B: Revertir en Git

```bash
# Ver commits recientes
git log --oneline -10

# Revertir el último commit
git revert HEAD
git push origin main
# Railway automáticamente despliega la versión anterior
```

## Optimizaciones (Opcional)

### 1. Caché de Dependencias

En `railway.toml`:
```toml
[build]
cacheKey = "npm-cache"
```

### 2. Reducir Tamaño de Imagen Docker

En `Dockerfile`, usar multi-stage (ya está configurado)

### 3. Environment-specific Settings

```bash
# .env.production
NODE_ENV=production
DEBUG=false

# .env.development
NODE_ENV=development
DEBUG=true
```

## Resumen de URLs Importantes

| Recurso | URL |
|---------|-----|
| Repository | `https://github.com/tu-usuario/queveo` |
| Railway Dashboard | `https://railway.app/project/[project-id]` |
| App en Producción | `https://queveo-prod.railway.app` |
| Supabase Admin | `https://app.supabase.com` |

---

**Listo! 🎉 Tu app QueVeo está en producción con actualizaciones automáticas desde GitHub.**
