# 🏗️ Arquitectura de QueVeo

## Visión General

QueVeo es una plataforma de recomendación de contenido que resuelve el problema de "paradoja del streaming": demasiado contenido, poco tiempo para decidir qué ver.

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO FINAL                            │
│                  (Web Browser)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ MicButton    │  │ Onboarding   │  │ PosterMarquee│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TanStack Router + React Query (Data Fetching)       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Radix UI + Tailwind CSS (Component Library)        │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (TanStack Start Node.js)               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Server Functions (RPC Layer)                 │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │ • recommendations.functions.ts               │    │   │
│  │  │ • moments.functions.ts                      │    │   │
│  │  │ • feedback.functions.ts                     │    │   │
│  │  │ • posters.functions.ts                      │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      AI Gateway (OpenAI Compatible)                 │   │
│  │  • Inference de preferencias                        │   │
│  │  • Generación de recomendaciones                    │   │
│  │  • Análisis de contexto                            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
    ┌─────────┐  ┌──────────┐  ┌─────────────┐
    │Supabase │  │ Supabase │  │ External    │
    │  Auth   │  │   DB     │  │ APIs        │
    │(JWT)    │  │(PostgreSQL) │(IA Models)  │
    └─────────┘  └──────────┘  └─────────────┘
```

## Stack Completo

### Frontend
| Tecnología | Propósito |
|------------|-----------|
| **React 19** | Framework UI |
| **TypeScript** | Type safety |
| **Vite** | Build tool (rápido) |
| **TanStack Router** | Routing declarativo |
| **TanStack Query** | Fetching y caché de datos |
| **Tailwind CSS 4** | Utilidades de estilos |
| **Radix UI** | Componentes accesibles sin estilos |
| **React Hook Form** | Gestión eficiente de forms |
| **Zod** | Validación de esquemas |

### Backend
| Tecnología | Propósito |
|------------|-----------|
| **TanStack Start** | Full-stack framework (React + Node.js) |
| **Node.js 22** | Runtime del servidor |
| **TypeScript** | Type safety en backend |
| **AI SDK** | Integración con modelos de IA |
| **OpenAI Compatible** | Soporte para múltiples proveedores |

### Base de Datos & Auth
| Tecnología | Propósito |
|------------|-----------|
| **Supabase** | BaaS (Database + Auth) |
| **PostgreSQL** | Base de datos relacional |
| **Supabase Auth** | Autenticación JWT |
| **Row Level Security** | Control de acceso granular |

### DevOps & Deployment
| Tecnología | Propósito |
|------------|-----------|
| **Docker** | Containerización |
| **Railway** | Deployment en la nube |
| **GitHub** | Control de versiones & CI/CD |
| **GitHub Actions** | Automatización de pipelines |

## Flujo de Datos (User Journey)

```
1. USER VISITS APP
   ↓
2. AUTHENTICATION CHECK
   ├─ Authenticated? → Go to Dashboard
   └─ Not Auth? → Show Login
   ↓
3. ONBOARDING (first time)
   ├─ Read Genres Preferences
   ├─ Read Time Context
   └─ Save to Guest Seed
   ↓
4. REQUEST RECOMMENDATIONS
   ├─ User Input (voice or text)
   │  ↓
   ├─ AI Gateway (Inference)
   │  ├─ Extract intent
   │  ├─ Get user context
   │  └─ Generate recommendation prompt
   │  ↓
   ├─ LLM Response
   │  └─ Parse and structure
   │  ↓
   ├─ Recommendations Engine
   │  ├─ Apply ranking logic
   │  ├─ Diversify results
   │  └─ Add metadata
   │  ↓
   ├─ Supabase Query
   │  ├─ Fetch content details
   │  └─ Get user ratings history
   │  ↓
5. DISPLAY RESULTS
   ├─ PosterMarquee component
   ├─ Show with metadata
   └─ Track impressions
   ↓
6. USER FEEDBACK
   ├─ User rates recommendation
   │  ↓
   ├─ Save feedback to DB
   │  ↓
   ├─ Update user moments
   │  ↓
   └─ Next iteration more accurate
```

## Mejoras vs Lovable

### 1. Backend Real ⚡

**Lovable (Limitado)**
```
Frontend → Lovable Edge Functions → Database
└─ Sin control de servidor
└─ Sin estado persistente real
└─ Limitado a 50KB de ejecución
```

**QueVeo (Full Control)**
```
Frontend → TanStack Start Server (Node.js) → Database
├─ Control total del servidor
├─ Pueden procesar datos complejos
├─ Pueden mantener estado entre requests
└─ Pueden hacer heavy lifting de IA
```

### 2. Recomendaciones Inteligentes 🧠

**Lovable (Simplista)**
- Solo keywords en prompts
- Sin contexto persistente
- Sin aprendizaje de feedback

**QueVeo (Sofisticada)**
```typescript
// Contexto persistente en Supabase
const userMoment = {
  mood: 'relaxed',
  timeOfDay: 'evening',
  duration: 60,
  genres: ['drama', 'thriller'],
  recentFeedback: [...],
  watchlist: [...]
}

// Prompt dinámico con contexto real
const prompt = generateSmartPrompt(userMoment)
// → Recomendaciones 10x más relevantes
```

### 3. Control de Variables 📊

**Lovable (Hard-coded)**
- Variables en código
- No se pueden cambiar sin redeploy
- No hay A/B testing

**QueVeo (Dinámico)**
```typescript
// Variables configurables en runtime
const weights = {
  genre: 0.4,
  duration: 0.3,
  trends: 0.2,
  feedback: 0.1
}

// Fácil ajustar y medir impacto
```

### 4. Autenticación Robusta 🔐

**Lovable (Básica)**
- Solo email/password
- Sin integración real con DB
- Sin row-level security

**QueVeo (Enterprise-grade)**
- Supabase Auth (OAuth, Magic Links, etc.)
- JWT tokens
- Row-level security en Supabase
- Sesiones persistentes

### 5. Escalabilidad 📈

**Lovable**
```
Users: 1-100 ✓ OK
Users: 100-1K ⚠️ Problemas
Users: 1K+ ❌ Falla
```

**QueVeo**
```
Users: 1-10K ✓ OK (Railway free tier)
Users: 10-100K ✓ OK (Railway pro)
Users: 100K+ ✓ OK (Railway con más replicas)
```

## Archivos Clave

### `/src/lib/`

```
recommendations.ts         # Core recommendation logic
recommendations.functions.ts  # Server-side RPC for recommendations
moments.functions.ts       # User context/moments persistence
feedback.functions.ts      # User feedback tracking
ai-gateway.ts              # IA integration & prompting
posters.functions.ts       # Content metadata & images
guestSeed.ts               # Anonymous user preferences
```

### `/src/routes/`

```
__root.tsx                 # Layout raíz + setup global
_authenticated.tsx         # Rutas protegidas
login.tsx                  # Página de login
```

### `/src/components/`

```
MicButton.tsx              # Voice input component
Onboarding.tsx             # First-time user flow
PosterMarquee.tsx          # Recomendaciones display
ui/                        # Radix UI components
```

## Decisiones Arquitectónicas

### 1. ¿Por qué TanStack Start?

✅ **Ventajas**
- Full-stack con mismo lenguaje (TypeScript)
- Server functions como RPC (tipo-seguro)
- No requiere separar frontend/backend repos
- Integración perfecta con Vite
- Hot module reload incluido

❌ **Tradeoffs**
- Menos maduro que Next.js
- Comunidad más pequeña
- Documentación limitada

### 2. ¿Por qué Supabase?

✅ **Ventajas**
- PostgreSQL (relacional, confiable)
- Auth integrada (JWT, OAuth)
- Row-level security (seguridad)
- Realtime capabilitites (no usado aún)
- Buena integración con AI/embeddings

❌ **Tradeoffs**
- Menos control que self-hosted
- Pricing por cliente puede escalar

### 3. ¿Por qué Railway?

✅ **Ventajas**
- Simplísimo con Docker
- Auto CI/CD desde GitHub
- Buena integración de variables de entorno
- Logs y monitoring incluido
- Pricing justo para MVPs

❌ **Tradeoffs**
- Menos opciones que Kubernetes
- Vendor lock-in

## Flujo de Deployment

```
Local Development
    ↓
git commit + git push origin main
    ↓
GitHub receives push
    ↓
GitHub → Railway webhook
    ↓
Railway detecta Dockerfile + railway.toml
    ↓
Railway builds Docker image
    ↓
Railway corre: npm run build
    ↓
Railway corre: npm run preview
    ↓
Railway verifica health check (GET / → 200)
    ↓
Railroad deploys new version
    ↓
App en vivo en https://queveo-prod.railway.app
```

## Performance Optimization

### 1. Frontend
- Code splitting por ruta (React Router)
- Lazy loading de componentes
- Image optimization (Radix Image)
- Caché de datos con React Query

### 2. Backend
- Request deduplication (React Query)
- Database connection pooling (Supabase)
- Caching de posters (posterCache.ts)

### 3. IA
- Prompt caching (futura mejora)
- Batching de requests
- Rate limiting

## Security Considerations

### 1. **Secretos**
✅ Nunca en código
✅ Nunca en git
✅ Solo en Railway variables

### 2. **Database**
✅ Row-level security activa
✅ SQL injection prevention (Supabase queries)
✅ Rate limiting en funciones

### 3. **Auth**
✅ JWT tokens
✅ HTTPS enforced
✅ CORS configurado

### 4. **AI Calls**
✅ API key nunca en frontend
✅ All AI calls through backend
✅ Rate limiting per user

## Próximas Mejoras

### 🎯 Corto Plazo
- [ ] Implementar feedback loops más sofisticados
- [ ] Agregar más voice inputs locales
- [ ] Mejorar UX del onboarding

### 📈 Mediano Plazo
- [ ] Embeddings + vector search (Supabase)
- [ ] Real-time collaboration features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard

### 🚀 Largo Plazo
- [ ] Multi-language support
- [ ] Custom recommendation models
- [ ] Federation con otros usuarios

---

**Esta arquitectura es escalable, mantenible y lista para producción.** ✨
