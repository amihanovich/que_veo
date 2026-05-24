# ✅ Pre-Deployment Checklist

## Antes de Subir a GitHub

- [ ] `.env` NO está en git (`git status | grep .env`)
- [ ] `.env.local` existe y tiene tus claves de Supabase
- [ ] `npm run build` se ejecuta sin errores
- [ ] `npm run preview` funciona localmente
- [ ] `npm run lint` pasa sin problemas
- [ ] `README.md` está actualizado
- [ ] `DEPLOYMENT.md` está actualizado
- [ ] `ARCHITECTURE.md` está actualizado
- [ ] `.gitignore` contiene `.env*`
- [ ] Git repo inicializado: `git init`
- [ ] Archivo `setup.sh` tiene permisos de ejecución: `chmod +x setup.sh`

```bash
# Quick check command:
git status | grep -i "\.env" || echo "✓ .env no está trackeado"
npm run build && echo "✓ Build OK" || echo "❌ Build failed"
npm run preview &
sleep 2
curl http://localhost:5173 > /dev/null && echo "✓ Preview OK" || echo "❌ Preview failed"
kill %1
```

## Antes de Conectar a Railway

- [ ] Repositorio público en GitHub
- [ ] `Dockerfile` existe en raíz
- [ ] `railway.toml` existe en raíz
- [ ] Cuenta Railway creada
- [ ] GitHub token para Railway (si usas CLI)
- [ ] Proyecto Supabase con API keys listas

```bash
# Verificar Dockerfile
ls -la Dockerfile

# Verificar railway.toml
cat railway.toml | grep -E "port|buildCommand"
```

## En Railway Dashboard

- [ ] Proyecto creado
- [ ] GitHub repo conectado
- [ ] Dockerfile detectado automáticamente
- [ ] Variables de entorno agregadas:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_PUBLISHABLE_KEY`
  - [ ] `VITE_SUPABASE_PROJECT_ID`
  - [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `NODE_ENV=production`
- [ ] Port configurado a 3000
- [ ] Health check path configurado a `/`

## En Supabase

- [ ] Proyecto creado
- [ ] Auth habilitado
- [ ] Row-level security configurado
- [ ] CORS settings actualizados para incluir:
  - [ ] `http://localhost:5173` (dev)
  - [ ] `https://your-railway-url` (prod)
- [ ] API keys copiadas y guardadas

## Después de Primer Deploy

- [ ] ✅ Deployment completed sin errores
- [ ] ✅ Logs muestran app corriendo en puerto 3000
- [ ] ✅ Health check pasando
- [ ] ✅ URL pública accesible
- [ ] ✅ Login funciona (conectar a Supabase)
- [ ] ✅ Recomendaciones cargan sin errores
- [ ] ✅ No hay errores de CORS
- [ ] ✅ Variables de entorno están siendo leídas

```bash
# Test endpoint
curl https://your-railway-url/
curl https://your-railway-url/api/health # Si existe

# Ver logs en vivo
railway logs -f
```

## Configuración de Git para Futuros Deploys

- [ ] Rama `main` es default
- [ ] Branch protection rules (opcional)
- [ ] Auto-deploy en Railway está activo
- [ ] GitHub Actions workflow configurado (opcional)

```bash
# Ver configuración de remote
git remote -v

# Verificar main es default
git branch -a | grep -E "^\*|main"
```

## Optimization Checklist

- [ ] `npm run build` genera production build
- [ ] Bundle size es razonable
- [ ] No hay console.logs innecesarios
- [ ] API calls están optimizadas (no duplicadas)
- [ ] Images están optimizadas
- [ ] CSS esté minificado

```bash
# Ver tamaño de build
du -sh dist/
```

## Security Checklist

- [ ] Ningún secreto en código
- [ ] `.env*` files en `.gitignore`
- [ ] Supabase RLS activo
- [ ] API keys son read-only donde es posible
- [ ] HTTPS enforced (Railway automático)
- [ ] CORS restringido a dominios conocidos
- [ ] Rate limiting configurado (si existe)

## CI/CD Checklist (Si usas GitHub Actions)

- [ ] `.github/workflows/` creado
- [ ] Workflow archivo existe (ej: `deploy.yml`)
- [ ] Workflow dispara en push a main
- [ ] Secrets configurados en GitHub:
  - [ ] `RAILWAY_TOKEN`
  - [ ] O conectar vía OAuth (más fácil)

## Monitoreo Post-Deploy

### Primera Semana
- [ ] Revisar logs diariamente
- [ ] Monitorear errores de users
- [ ] Verificar performance metrics
- [ ] Confirmar Supabase queries están optimizadas

### Mensual
- [ ] Revisar Railway billing
- [ ] Actualizar dependencias npm
- [ ] Revisar security patches
- [ ] Analizar user feedback

## Troubleshooting Rápido

Si algo falla:

1. **Logs**: `railway logs -f` → buscar `ERROR` o `500`
2. **Health Check**: ¿Responde en `/`? 
3. **Variables**: ¿Todas las env vars están set?
4. **Build**: ¿`npm run build` funciona localmente?
5. **Port**: ¿Está corriendo en puerto 3000?
6. **Dependencies**: ¿Instala correctamente? (`npm ci`)

## Documentación Adicional

- `README.md` - Guía principal
- `DEPLOYMENT.md` - Instrucciones detalladas
- `ARCHITECTURE.md` - Arquitectura y decisiones técnicas
- `CONTRIBUTING.md` (si quieres) - Guía para contribuyentes

---

**Checklist completado? ✅ Estás listo para producción!**
