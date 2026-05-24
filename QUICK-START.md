# 🚀 Quick Start - QueVeo en 5 minutos

## 1️⃣ Setup Local (2 min)

```bash
# Clonar y entrar al proyecto
git clone https://github.com/tu-usuario/queveo.git
cd queveo

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
```

## 2️⃣ Configurar Supabase (2 min)

1. Ve a [supabase.com](https://app.supabase.com)
2. Crea nuevo proyecto (o usa uno existente)
3. Copia estas claves desde **Settings > API**:
   ```
   Project URL → SUPABASE_URL
   Anon Public Key → SUPABASE_PUBLISHABLE_KEY
   ```
4. Pega en `.env.local`:
   ```env
   SUPABASE_URL=https://...
   SUPABASE_PUBLISHABLE_KEY=eyJh...
   VITE_SUPABASE_URL=https://...
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJh...
   VITE_SUPABASE_PROJECT_ID=your-id
   ```

## 3️⃣ Ejecutar Localmente (1 min)

```bash
npm run dev
```

Abre `http://localhost:5173`

---

## 🚀 Desplegar en Railway

### Opción A: Automático (3 clics) ⭐

1. Crea cuenta en [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Selecciona repositorio
4. ✅ Railway automáticamente:
   - Detecta Dockerfile
   - Construye imagen
   - Despliega en vivo

### Opción B: Desde CLI (2 comandos)

```bash
npm install -g @railway/cli
railway login
railway init
# Selecciona "Link existing project"
railway up
```

### ⚙️ Variables en Railway

En **Dashboard → Proyecto → Variables**, agregar:

```
SUPABASE_URL=https://...
SUPABASE_PUBLISHABLE_KEY=eyJh...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_PUBLISHABLE_KEY=eyJh...
VITE_SUPABASE_PROJECT_ID=your-id
NODE_ENV=production
```

---

## ✅ ¿Funcionando?

- [ ] `npm run dev` → App en http://localhost:5173
- [ ] Login/Signup funciona
- [ ] Recomendaciones cargan
- [ ] No hay errores rojo en console

---

## 📖 Documentación Completa

- **Desarrollo**: `README.md`
- **Deployment Detallado**: `DEPLOYMENT.md`
- **Arquitectura**: `ARCHITECTURE.md`
- **Checklist**: `PRE-DEPLOYMENT-CHECKLIST.md`

---

## 🆘 Problemas Comunes

| Problema | Solución |
|----------|----------|
| `.env.local` no funciona | Restart `npm run dev` |
| Login falla | Verifica `SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Build error | `npm ci` → `npm run build` |
| Puerto 5173 ocupado | `npm run dev -- --port 3001` |

---

**Listo! 🎉 Ahora puedes desarrollar y desplegar.**
