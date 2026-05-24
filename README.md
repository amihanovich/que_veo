# QueVeo 🎬

Una plataforma inteligente de recomendación de contenido impulsada por IA. Encuentra exactamente qué ver en tus plataformas de streaming sin perder tiempo buscando.

## 🎯 Propósito Principal

El problema que resuelve QueVeo es **la carga cognitiva de buscar contenido relevante** en plataformas de streaming. Con cientos de títulos disponibles, los usuarios pasan más tiempo navegando que viendo. QueVeo utiliza:

- **Lógica de recomendación inteligente** basada en preferencias del usuario
- **Inferencia contextual** para entender qué quieres ver en ese momento
- **Variables de recomendación personalizadas** que aprenden de tu historial

## 🏗️ Stack Técnico

- **Frontend**: React 19 + TypeScript
- **Full-Stack Framework**: TanStack Start (servidor de Node.js integrado)
- **Routing**: TanStack Router
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estilos**: Tailwind CSS + Radix UI
- **IA**: AI SDK con OpenAI compatible
- **Build Tool**: Vite
- **Despliegue**: Railway + Docker

## 🚀 Inicio Rápido

### Requisitos previos
- Node.js 22+
- npm o bun
- Cuenta de Supabase
- (Opcional) Credenciales de API de IA

### Instalación local

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/queveo.git
cd queveo

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus claves de Supabase
```

### Variables de Entorno Requeridas

```env
# Supabase (obligatorio)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_SUPABASE_PROJECT_ID=your-project-id

# IA (opcional, solo si usas AI Gateway)
# OPENAI_API_KEY=sk-...
```

### Desarrollo

```bash
npm run dev
```

Accede a `http://localhost:5173`

### Producción

```bash
npm run build
npm run preview
```

## 📋 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo (Vite + Node.js) |
| `npm run build` | Construye para producción |
| `npm run preview` | Previsualiza build de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run format` | Formatea código con Prettier |

## 🗄️ Estructura del Proyecto

```
src/
├── routes/                 # TanStack Router routes
│   ├── __root.tsx         # Layout raíz
│   ├── login.tsx          # Página de login
│   └── _authenticated.tsx # Layout de rutas autenticadas
├── components/
│   ├── MicButton.tsx      # Botón de micrófono para input por voz
│   ├── Onboarding.tsx     # Flujo de onboarding
│   ├── PosterMarquee.tsx  # Carrusel de pósters
│   └── ui/                # Componentes Radix UI
├── lib/
│   ├── recommendations.ts # Lógica core de recomendaciones
│   ├── moments.functions.ts # Gestión de "momentos" de usuario
│   ├── ai-gateway.ts      # Integración con IA
│   ├── context.ts         # Context API utilities
│   └── *functions.ts      # Server functions para Supabase
└── server.ts              # Configuración del servidor TanStack
```

## 🔧 Limitaciones de Lovable (Versión Anterior)

La versión anterior construida con Lovable tenía limitaciones significativas:

### 1. **Escalabilidad de Backend**
- Lovable no permite servidor backend real, solo edge functions
- Imposible mantener estado persistente para recomendaciones complejas
- Limitado para procesamiento de datos pesado

### 2. **Autenticación y Base de Datos**
- Integración limitada con Supabase
- No hay forma de manejar sesiones de usuario correctamente
- Queries de datos complejas difíciles de optimizar

### 3. **Control de IA y Contexto**
- No se puede mantener contexto conversacional persistente
- Imposible ajustar finely el comportamiento del modelo de IA
- Limitado para inferencia en tiempo real de preferencias

### 4. **Deployment y Configuración**
- Solo despliegues a través de plataforma Lovable
- No hay control sobre variables de entorno
- Imposible usar secrets seguros

### 5. **Personalización de UX**
- Componentes limitados
- Difícil crear flujos conversacionales avanzados
- Limitaciones en manejo de input por voz/micrófono

## ✨ Mejoras Implementadas en Esta Versión

- ✅ **Backend real** con TanStack Start (Node.js)
- ✅ **Arquitectura escalable** con server functions y Supabase
- ✅ **Autenticación robusta** integrada con Supabase
- ✅ **Recomendaciones inteligentes** con contexto persistente
- ✅ **Input por voz** con `MicButton` component
- ✅ **Deployment a Railway** con Docker
- ✅ **Control total** sobre variables de entorno
- ✅ **Base de datos relacional** con Supabase PostgreSQL

## 🚀 Despliegue en Railway

### Opción 1: Usando Railway CLI (Recomendado)

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Autenticarse
railway login

# 3. Crear nuevo proyecto
railway init

# 4. Vincularse al repositorio
railway link

# 5. Desplegar
railway up
```

### Opción 2: Usando Railway UI (Web)

1. Ir a [railway.app](https://railway.app)
2. Crear nuevo proyecto
3. Conectar repositorio GitHub
4. Railway detectará automáticamente `Dockerfile` y `railway.toml`
5. Agregar variables de entorno en Settings:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL` (mismo que `SUPABASE_URL`)

### Opción 3: GitHub Actions CI/CD

Crear `.github/workflows/railway-deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railway-app/github-action@v1
        with:
          token: ${{ secrets.RAILWAY_TOKEN }}
          service: QueVeo
```

## 📊 Arquitectura de Recomendaciones

La lógica core está en `src/lib/recommendations.ts` y usa:

1. **Guest Seed**: Preferencias anónimas iniciales
2. **Moments**: Snapshots de contexto del usuario
3. **Feedback**: Rating de recomendaciones para mejorar
4. **Poster Cache**: Optimización de imágenes

### Cómo Funciona:
```
User Interaction
    ↓
MicButton (voice input) o selección manual
    ↓
AI Gateway (inferencia con contexto)
    ↓
Recommendations Engine (lógica inteligente)
    ↓
Supabase (persistencia)
    ↓
Display UI
```

## 🔐 Seguridad

- ✅ Autenticación con JWT vía Supabase
- ✅ Row-level security en Supabase
- ✅ Nunca guardar secretos en código (usar `.env`)
- ✅ CORS configurado para solo dominios autorizados
- ✅ Rate limiting en funciones de IA

## 📝 Variables Clave de Recomendación

El algoritmo considera:

- **Genre Preferences** (géneros favoritos)
- **Duration** (duración preferida para ver)
- **Time of Day** (contenido según hora del día)
- **Recent Feedback** (últimas valoraciones)
- **Trending** (contenido en tendencia)
- **Watchlist Completion** (qué falta por ver)

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📬 Soporte

Para issues, dudas o sugerencias, abre un [GitHub Issue](https://github.com/tu-usuario/queveo/issues)

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver `LICENSE` para detalles.

---

**Construido con ❤️ para resolver la paradoja del streaming: demasiado contenido, poco tiempo.**
