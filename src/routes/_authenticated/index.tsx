import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Play, Sparkles, ArrowLeft, Plus, Bookmark, Check, X, ArrowUp, ThumbsUp, Heart, RefreshCw, EyeOff } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  PLATFORM_OPTIONS,
  TIME_OPTIONS,
  COMPANY_OPTIONS,
  MOOD_OPTIONS,
  TYPE_OPTIONS,
  ATTENTION_OPTIONS,
  NOVELTY_OPTIONS,
  colorForPlatform,
  deepLinkFor,
  type Platform,
  type SituationFilters,
  type Recommendation,
  type RecommendationsResult,
} from "@/lib/recommendations";
import {
  recommendFromText,
  recommendFromFilters,
  inferMomentFilters,
} from "@/lib/recommendations.functions";
import { recordTitleFeedback } from "@/lib/feedback.functions";
import { fetchPosters } from "@/lib/posters.functions";
import {
  listMoments,
  saveMoment,
  detectPattern,
  getProfile,
  setDefaultPlatforms,
  type MomentRow,
} from "@/lib/moments.functions";
import { inferContext, contextToPromptHint, seasonHintShort } from "@/lib/context";
import {
  getWeatherSnapshot,
  isWeatherEnabled,
  setWeatherEnabled,
  weatherHintShort,
  type WeatherSnapshot,
} from "@/lib/environment";
import { cn } from "@/lib/utils";
import { MicButton } from "@/components/MicButton";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

type Step = "home" | "filters" | "loading" | "results";

const GUEST_PLATFORMS_KEY = "queveo:guest:default_platforms";

function readGuestPlatforms(): Platform[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_PLATFORMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Platform[]) : [];
  } catch {
    return [];
  }
}

function HomePage() {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("home");
  const [freeText, setFreeText] = useState("");
  const [filters, setFilters] = useState<SituationFilters>({
    time: null,
    company: null,
    mood: null,
    type: null,
    attention: null,
    novelty: null,
    platforms: [],
  });
  const [results, setResults] = useState<RecommendationsResult | null>(null);
  const [resultsSource, setResultsSource] = useState<"text" | "filters" | "moment">("filters");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [posters, setPosters] = useState<Record<string, string | null>>({});

  const loadPostersFor = (data: RecommendationsResult) => {
    const items = [data.main, ...data.alternatives].map((r) => ({
      title: r.title,
      type: r.type,
    }));
    fetchPosters({ data: { items } })
      .then((res) => setPosters((prev) => ({ ...prev, ...res.posters })))
      .catch(() => {});
  };

  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const isGuest = sessionReady && !session;

  const [guestPlatforms, setGuestPlatforms] = useState<Platform[]>(() => readGuestPlatforms());

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
    enabled: !!session,
  });
  const { data: moments } = useQuery({
    queryKey: ["moments"],
    queryFn: () => listMoments(),
    enabled: !!session,
  });
  const { data: patternData } = useQuery({
    queryKey: ["pattern"],
    queryFn: () => detectPattern(),
    enabled: step === "results" && !!session,
  });

  const defaultPlatforms = (
    isGuest ? guestPlatforms : (profile?.default_platforms ?? [])
  ) as Platform[];

  // Si el usuario no eligió plataformas, usamos las del perfil (o guest)
  const effectivePlatforms = (
    filters.platforms.length > 0 ? filters.platforms : defaultPlatforms
  ) as Platform[];

  // Estado del toggle de ubicación/clima — global a la pantalla.
  const [useLocation, setUseLocation] = useState<boolean>(() => isWeatherEnabled());
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Si el usuario ya había habilitado el toggle, refrescamos clima en background.
  useEffect(() => {
    if (!useLocation) return;
    setWeatherLoading(true);
    getWeatherSnapshot()
      .then((w) => setWeather(w))
      .finally(() => setWeatherLoading(false));
  }, [useLocation]);

  const toggleLocation = async (enabled: boolean) => {
    setWeatherEnabled(enabled);
    setUseLocation(enabled);
    if (!enabled) {
      setWeather(null);
      return;
    }
    setWeatherLoading(true);
    const w = await getWeatherSnapshot();
    setWeather(w);
    setWeatherLoading(false);
  };

  const buildEnvHints = () => {
    const ctx = inferContext();
    return {
      contextHint: contextToPromptHint(ctx),
      seasonHint: seasonHintShort(ctx),
      weatherHint: weather ? weatherHintShort(weather) : null,
    };
  };

  const runText = async (excludeList: string[] = excluded) => {
    if (freeText.trim().length < 3) return;
    const plats =
      effectivePlatforms.length > 0 ? effectivePlatforms : (PLATFORM_OPTIONS as Platform[]);
    setError(null);
    setResultsSource("text");
    setStep("loading");
    try {
      const env = buildEnvHints();
      const data = await recommendFromText({
        data: {
          text: freeText.trim(),
          platforms: plats,
          contextHint: env.contextHint,
          seasonHint: env.seasonHint,
          weatherHint: env.weatherHint,
          excludeTitles: excludeList,
        },
      });
      setResults(data);
      loadPostersFor(data);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
      setStep("home");
    }
  };

  const runFilters = async (
    source: "filters" | "moment",
    overrideFilters?: SituationFilters,
    extraText?: string,
    excludeList: string[] = excluded,
  ) => {
    const f = overrideFilters ?? filters;
    let plats = (f.platforms.length > 0 ? f.platforms : defaultPlatforms) as Platform[];
    if (plats.length === 0) plats = PLATFORM_OPTIONS as Platform[];
    setError(null);
    setResultsSource(source);
    setStep("loading");
    try {
      const env = buildEnvHints();
      const data = await recommendFromFilters({
        data: {
          time: f.time,
          company: f.company,
          mood: f.mood,
          type: f.type,
          attention: f.attention,
          novelty: f.novelty,
          platforms: plats,
          contextHint: env.contextHint,
          seasonHint: env.seasonHint,
          weatherHint: env.weatherHint,
          source,
          extraText: extraText ?? null,
          excludeTitles: excludeList,
        },
      });
      setResults(data);
      loadPostersFor(data);
      setStep("results");
      if (!isGuest) qc.invalidateQueries({ queryKey: ["pattern"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
      setStep("home");
    }
  };

  // "Ya la vi" — agrega el título a la lista de exclusión y vuelve a pedir recomendación.
  // "Ya la vi" — solo agrega a exclusión + registra feedback. NO refresca: el usuario
  // puede seguir viendo el resto y decidir si pide otras opciones.
  const handleSeen = (title: string, platform: string) => {
    if (!excluded.includes(title)) setExcluded([...excluded, title]);
    void recordTitleFeedback({ data: { title, platform, sentiment: "seen" } }).catch(() => {});
  };

  const handleFeedback = (title: string, platform: string, sentiment: "like" | "love") => {
    void recordTitleFeedback({ data: { title, platform, sentiment } }).catch(() => {});
  };

  // Re-pide recomendaciones con los actuales filtros/texto, excluyendo lo que ya
  // marcaste. Se dispara con el botón explícito "Buscar otras opciones".
  const rerunExcludingSeen = () => {
    if (resultsSource === "text") {
      runText(excluded);
    } else {
      runFilters(
        resultsSource,
        undefined,
        freeText.trim().length >= 3 ? freeText.trim() : undefined,
        excluded,
      );
    }
  };

  const useMoment = (m: MomentRow) => {
    const f: SituationFilters = {
      time: (m.time_filter as SituationFilters["time"]) ?? null,
      company: (m.company_filter as SituationFilters["company"]) ?? null,
      mood: (m.mood_filter as SituationFilters["mood"]) ?? null,
      type: (m.type_filter as SituationFilters["type"]) ?? null,
      attention: (m.attention_filter as SituationFilters["attention"]) ?? null,
      novelty: (m.novelty_filter as SituationFilters["novelty"]) ?? null,
      platforms: (m.platforms as Platform[]) ?? [],
    };
    setFilters(f);
    setExcluded([]);
    // Si el Momento se guardó con use_location=true, activamos el toggle.
    if (m.use_location && !useLocation) {
      toggleLocation(true);
    }
    const extra = freeText.trim().length >= 3 ? freeText.trim() : undefined;
    runFilters("moment", f, extra, []);
  };

  const saveDefaultPlatforms = async (plats: Platform[]) => {
    if (isGuest) {
      localStorage.setItem(GUEST_PLATFORMS_KEY, JSON.stringify(plats));
      setGuestPlatforms(plats);
      return;
    }
    await setDefaultPlatforms({ data: { platforms: plats } });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const handleBack = () => {
    setResults(null);
    setExcluded([]);
    setStep("home");
  };

  return (
    <main className="mx-auto max-w-xl px-5 pb-12">
      {step === "home" && (
        <HomeScreen
          freeText={freeText}
          onFreeTextChange={setFreeText}
          onSubmitText={() => {
            setExcluded([]);
            runText([]);
          }}
          filters={filters}
          onFiltersChange={setFilters}
          onSubmitFilters={() => {
            setExcluded([]);
            runFilters("filters", undefined, undefined, []);
          }}
          onSurprise={() => {
            setExcluded([]);
            const emptyFilters: SituationFilters = {
              time: null,
              company: null,
              mood: null,
              type: null,
              attention: null,
              novelty: null,
              platforms: filters.platforms,
            };
            runFilters("filters", emptyFilters, undefined, []);
          }}
          onSaveDefaultPlatforms={saveDefaultPlatforms}
          defaultPlatforms={defaultPlatforms}
          moments={isGuest ? [] : (moments ?? [])}
          onUseMoment={useMoment}
          error={error}
          isGuest={isGuest}
          useLocation={useLocation}
          weather={weather}
          weatherLoading={weatherLoading}
          onToggleLocation={toggleLocation}
        />
      )}
      {step === "loading" && <LoadingScreen />}
      {step === "results" && results && (
        <ResultsScreen
          results={results}
          resolvedFilters={filters}
          source={resultsSource}
          freeText={freeText}
          patternSuggestion={isGuest ? null : (patternData?.suggestion ?? null)}
          existingMoments={isGuest ? [] : (moments ?? [])}
          onBack={handleBack}
          isGuest={isGuest}
          excludedCount={excluded.length}
          onSeen={handleSeen}
          onFeedback={handleFeedback}
          onRerunExcludingSeen={rerunExcludingSeen}
          isGuestForFeedback={isGuest}
          posters={posters}
          onSaveMoment={async (name) => {
            const ctx = inferContext();
            await saveMoment({
              data: {
                name,
                time_filter: results.filters.time,
                company_filter: results.filters.company,
                mood_filter: results.filters.mood,
                type_filter: results.filters.type,
                attention_filter: results.filters.attention ?? filters.attention ?? null,
                novelty_filter: results.filters.novelty ?? filters.novelty ?? null,
                season_hint: seasonHintShort(ctx),
                weather_hint: weather ? weatherHintShort(weather) : null,
                use_location: useLocation,
                platforms: effectivePlatforms,
                auto_detected: false,
              },
            });
            qc.invalidateQueries({ queryKey: ["moments"] });
          }}
        />
      )}
    </main>
  );
}

/* ===================== HOME ===================== */

function HomeScreen({
  freeText,
  onFreeTextChange,
  onSubmitText,
  filters,
  onFiltersChange,
  onSubmitFilters,
  onSurprise,
  onSaveDefaultPlatforms,
  defaultPlatforms,
  moments,
  onUseMoment,
  error,
  isGuest,
  useLocation,
  weather,
  weatherLoading,
  onToggleLocation,
}: {
  freeText: string;
  onFreeTextChange: (v: string) => void;
  onSubmitText: () => void;
  filters: SituationFilters;
  onFiltersChange: (f: SituationFilters) => void;
  onSubmitFilters: () => void;
  onSurprise: () => void;
  onSaveDefaultPlatforms: (plats: Platform[]) => Promise<void>;
  defaultPlatforms: string[];
  moments: MomentRow[];
  onUseMoment: (m: MomentRow) => void;
  error: string | null;
  isGuest: boolean;
  useLocation: boolean;
  weather: WeatherSnapshot | null;
  weatherLoading: boolean;
  onToggleLocation: (enabled: boolean) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [restrictPlatforms, setRestrictPlatforms] = useState<boolean>(
    defaultPlatforms.length > 0,
  );

  // Inicializar plataformas seleccionadas con las default cuando llegan
  useEffect(() => {
    if (defaultPlatforms.length > 0 && filters.platforms.length === 0) {
      onFiltersChange({ ...filters, platforms: defaultPlatforms as Platform[] });
      setRestrictPlatforms(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPlatforms.join(",")]);

  const togglePlatform = (p: Platform) => {
    const has = filters.platforms.includes(p);
    onFiltersChange({
      ...filters,
      platforms: has
        ? filters.platforms.filter((x) => x !== p)
        : [...filters.platforms, p],
    });
  };

  const activeFilterCount = [
    filters.time,
    filters.company,
    filters.mood,
    filters.type,
    filters.attention,
    filters.novelty,
  ].filter(Boolean).length;

  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsSummary = useMemo(() => {
    const parts: string[] = [];
    parts.push(restrictPlatforms && filters.platforms.length > 0
      ? `${filters.platforms.length} plataforma${filters.platforms.length > 1 ? "s" : ""}`
      : "Todas las plataformas");
    if (useLocation) parts.push("ubicación on");
    return parts.join(" · ");
  }, [restrictPlatforms, filters.platforms, useLocation]);

  return (
    <section className="animate-fade-in pt-4">
      {/* HERO tipo Google: una sola caja, clara y central */}
      <div className="relative text-center">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-48 bg-gradient-hero" aria-hidden="true" />
        <h1 className="relative font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          ¿Qué <span className="text-primary">vemos hoy</span>?
        </h1>
        <p className="relative mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Decinos qué querés ver y te lo resolvemos en 90 segundos.
        </p>
      </div>

      {/* 1. CAJA DE TEXTO — punto de arranque principal */}
      <div className="mt-6 rounded-3xl border-2 border-primary/50 bg-card p-4 shadow-card">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-primary">
          <Sparkles className="mr-1 inline h-3 w-3" />
          Escribí o dictá lo que querés
        </label>
        <div className="rounded-2xl border border-primary/40 bg-input-surface shadow-sm transition-smooth focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
          <textarea
            value={freeText}
            onChange={(e) => onFreeTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (freeText.trim().length >= 3) onSubmitText();
              }
            }}
            rows={3}
            placeholder="Ej: estoy cansado, quiero algo liviano… (Enter para enviar)"
            className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-base text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
          />
          <div className="flex items-center justify-end gap-2 px-2 pb-2">
            <MicButton
              onTranscript={(t, isFinal) => {
                if (!t || !isFinal) return;
                onFreeTextChange(freeText ? `${freeText.trim()} ${t}` : t);
              }}
            />
            <button
              type="button"
              onClick={onSubmitText}
              disabled={freeText.trim().length < 3}
              aria-label="Enviar"
              title="Enviar"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full transition-smooth",
                freeText.trim().length >= 3
                  ? "bg-gradient-primary text-primary-foreground shadow-primary hover:opacity-90 active:scale-95"
                  : "cursor-not-allowed bg-background text-muted-foreground",
              )}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button
          onClick={onSubmitText}
          disabled={freeText.trim().length < 3}
          className={cn(
            "mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-smooth",
            freeText.trim().length >= 3
              ? "bg-gradient-primary text-primary-foreground shadow-primary active:scale-[0.98]"
              : "cursor-not-allowed bg-background text-muted-foreground",
          )}
        >
          <Sparkles className="h-4 w-4" />
          Recomendame algo
        </button>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>¿no sabés qué querés?</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <button
          type="button"
          onClick={onSurprise}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-transparent px-5 py-2.5 text-sm font-medium text-foreground transition-smooth hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
          title="Recomendación basada en tu historial, el momento del día y el clima"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          Sorprendeme según mi gusto
        </button>
      </div>


      {/* 2. AJUSTES (colapsable) — plataformas + ubicación */}
      <button
        onClick={() => setOptionsOpen((v) => !v)}
        className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card/40 px-4 py-3 text-left transition-smooth hover:border-primary/60"
        aria-expanded={optionsOpen}
      >
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Ajustes de búsqueda
          </div>
          <div className="mt-0.5 truncate text-[11px] text-foreground/70">
            {optionsSummary}
          </div>
        </div>
        <Plus
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            optionsOpen && "rotate-45",
          )}
        />
      </button>

      {optionsOpen && (
        <div className="mt-2 space-y-4 rounded-2xl border border-border bg-card/40 p-4">
          {/* Plataformas */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                ¿Dónde buscamos?
              </span>
              <div className="flex rounded-full border border-border bg-background p-0.5 text-[11px]">
                <button
                  onClick={() => setRestrictPlatforms(false)}
                  className={cn(
                    "rounded-full px-3 py-1 transition-smooth",
                    !restrictPlatforms
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Todas
                </button>
                <button
                  onClick={() => setRestrictPlatforms(true)}
                  className={cn(
                    "rounded-full px-3 py-1 transition-smooth",
                    restrictPlatforms
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Mis plataformas
                </button>
              </div>
            </div>

            {!restrictPlatforms ? (
              <p className="text-[11px] text-muted-foreground">
                Buscamos en todas las plataformas (puede sugerirte algo donde no estés suscrito).
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORM_OPTIONS.map((p) => {
                    const active = filters.platforms.includes(p);
                    return (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p)}
                        style={
                          active
                            ? {
                                borderColor: colorForPlatform(p),
                                background: `${colorForPlatform(p)}22`,
                              }
                            : undefined
                        }
                        className={cn(
                          "inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-smooth",
                          active
                            ? "text-foreground"
                            : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: colorForPlatform(p) }}
                        />
                        {p}
                      </button>
                    );
                  })}
                </div>
                {filters.platforms.length > 0 &&
                  JSON.stringify([...filters.platforms].sort()) !==
                    JSON.stringify([...defaultPlatforms].sort()) && (
                    <button
                      onClick={() => onSaveDefaultPlatforms(filters.platforms as Platform[])}
                      className="mt-2 text-[11px] text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                    >
                      Guardar como mis plataformas predeterminadas
                    </button>
                  )}
              </>
            )}
          </div>

          {/* Ubicación */}
          <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-3 w-3 text-primary" />
                Usar mi ubicación
              </div>
              {useLocation && weatherLoading && (
                <p className="mt-1 text-[11px] text-muted-foreground">Leyendo clima…</p>
              )}
              {useLocation && !weatherLoading && weather && (
                <p className="mt-1 text-[11px] text-primary">
                  Ahora: {weatherHintShort(weather)}
                </p>
              )}
              {useLocation && !weatherLoading && !weather && (
                <p className="mt-1 text-[11px] text-destructive">
                  No pudimos leer el clima (¿permiso denegado?).
                </p>
              )}
              {!useLocation && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Suma el clima actual al contexto. Tu ubicación no se guarda.
                </p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={useLocation}
              onClick={() => onToggleLocation(!useLocation)}
              className={cn(
                "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                useLocation ? "bg-primary" : "bg-border",
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-background transition-transform",
                  useLocation ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* SEPARADOR conceptual: o configurá un Momento */}
      <div className="mt-10 flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">o</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* 3. MOMENTOS */}
      <div className="mt-6">
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Bookmark className="h-4 w-4 text-primary" />
            Configurá un Momento
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            Una situación recurrente (tiempo, compañía, mood…) que querés reusar.
            {" "}
            {freeText.trim().length >= 3 ? (
              <span className="text-primary">Tu texto de arriba se combina como matiz extra.</span>
            ) : (
              <span>También podés combinarlo con el texto de arriba.</span>
            )}
          </p>
          {!isGuest && moments.length > 0 && (
            <Link
              to="/moments"
              className="mt-1 inline-block text-[11px] text-muted-foreground hover:text-foreground"
            >
              Gestionar mis Momentos →
            </Link>
          )}
        </div>

        {!isGuest && moments.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-3">
            {moments.map((m) => (
              <button
                key={m.id}
                onClick={() => onUseMoment(m)}
                className="flex min-h-[88px] flex-col items-start gap-1 rounded-2xl border border-border bg-card/70 p-3 text-left transition-smooth hover:border-primary/60 hover:bg-card"
              >
                <span className="text-sm font-semibold text-foreground line-clamp-2">
                  {m.name}
                </span>
                <span className="text-[11px] text-muted-foreground line-clamp-2">
                  {summarizeMoment(m)}
                </span>
              </button>
            ))}
          </div>
        )}

        {isGuest && (
          <div className="mb-3 rounded-2xl border border-dashed border-border bg-transparent p-3 text-center text-[11px] text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              Iniciá sesión
            </Link>{" "}
            para guardar tus Momentos y reutilizarlos. Sin login, podés armar uno para esta búsqueda.
          </div>
        )}

        {/* Crear nuevo Momento (= configurar filtros) */}
        <button
          onClick={() => setCreateOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-transparent px-4 py-3 text-left transition-smooth hover:border-primary"
          aria-expanded={createOpen}
        >
          <div>
            <div className="text-sm font-semibold text-foreground">
              {createOpen ? "Armá tu Momento" : "Crear nuevo Momento"}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {activeFilterCount > 0
                ? `${activeFilterCount} filtro${activeFilterCount > 1 ? "s" : ""} elegido${activeFilterCount > 1 ? "s" : ""}`
                : "Tiempo, compañía, mood, tipo"}
            </div>
          </div>
          <Plus
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
              createOpen && "rotate-45",
            )}
          />
        </button>

        {createOpen && (
          <div className="mt-3 space-y-6 rounded-2xl border border-border bg-card/40 p-4">
            <MomentAiBuilder
              onInferred={(f) =>
                onFiltersChange({
                  ...filters,
                  time: (f.time as SituationFilters["time"]) ?? null,
                  company: (f.company as SituationFilters["company"]) ?? null,
                  mood: (f.mood as SituationFilters["mood"]) ?? null,
                  type: (f.type as SituationFilters["type"]) ?? null,
                  attention:
                    (f.attention as SituationFilters["attention"]) ?? filters.attention ?? null,
                  novelty:
                    (f.novelty as SituationFilters["novelty"]) ?? filters.novelty ?? null,
                })
              }
            />
            <FilterGroup
              label="¿Cuánto tiempo tenés?"
              options={TIME_OPTIONS}
              value={filters.time}
              onSelect={(v) =>
                onFiltersChange({ ...filters, time: v as SituationFilters["time"] })
              }
            />
            <FilterGroup
              label="¿Con quién?"
              options={COMPANY_OPTIONS}
              value={filters.company}
              onSelect={(v) =>
                onFiltersChange({ ...filters, company: v as SituationFilters["company"] })
              }
            />
            <FilterGroup
              label="¿Qué mood?"
              options={MOOD_OPTIONS}
              value={filters.mood}
              onSelect={(v) =>
                onFiltersChange({ ...filters, mood: v as SituationFilters["mood"] })
              }
            />
            <FilterGroup
              label="¿Tipo?"
              options={TYPE_OPTIONS}
              value={filters.type}
              onSelect={(v) =>
                onFiltersChange({ ...filters, type: v as SituationFilters["type"] })
              }
            />
            <FilterGroup
              label="¿Nivel de atención?"
              options={ATTENTION_OPTIONS}
              value={filters.attention}
              onSelect={(v) =>
                onFiltersChange({ ...filters, attention: v as SituationFilters["attention"] })
              }
            />
            <FilterGroup
              label="¿Novedad?"
              options={NOVELTY_OPTIONS}
              value={filters.novelty}
              onSelect={(v) =>
                onFiltersChange({ ...filters, novelty: v as SituationFilters["novelty"] })
              }
            />

            <button
              onClick={onSubmitFilters}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-6 text-sm font-semibold text-primary-foreground shadow-primary transition-smooth active:scale-[0.98]"
            >
              {isGuest ? "Buscar con este Momento" : "Buscar (y guardalo después)"}
            </button>
            {!isGuest && (
              <p className="-mt-3 text-center text-[11px] text-muted-foreground">
                Si te gustan los resultados, podrás guardarlo con nombre.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function summarizeMoment(m: MomentRow): string {
  const parts = [m.time_filter, m.company_filter, m.mood_filter, m.type_filter].filter(
    Boolean,
  );
  if (parts.length === 0 && (m.platforms?.length ?? 0) > 0) {
    return m.platforms.slice(0, 3).join(" · ");
  }
  return parts.length > 0 ? parts.join(" · ") : "Sin filtros";
}

function MomentAiBuilder({
  onInferred,
}: {
  onInferred: (f: {
    time: string | null;
    company: string | null;
    mood: string | null;
    type: string | null;
    attention?: string | null;
    novelty?: string | null;
  }) => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const run = async () => {
    if (text.trim().length < 3) return;
    setLoading(true);
    setErr(null);
    setOk(false);
    try {
      const f = await inferMomentFilters({ data: { text: text.trim() } });
      onInferred(f);
      setOk(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No pudimos inferir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
      <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-primary">
        <Sparkles className="mr-1 inline h-3 w-3" />
        Armalo con IA (opcional)
      </label>
      <div className="rounded-lg border border-primary/30 bg-input-surface transition-smooth focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOk(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!loading && text.trim().length >= 3) run();
            }
          }}
          rows={2}
          placeholder="Ej: viernes a la noche con mi pareja, algo liviano…"
          className="w-full resize-none bg-transparent px-3 pt-3 pb-1.5 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
        />
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <span className="text-[11px] text-muted-foreground">
            Pre-llenamos los filtros abajo.
          </span>
          <div className="flex items-center gap-2">
            <MicButton
              onTranscript={(t, isFinal) => {
                if (!t || !isFinal) return;
                setText((prev) => (prev ? `${prev.trim()} ${t}` : t));
                setOk(false);
              }}
            />
            <button
              type="button"
              onClick={run}
              disabled={loading || text.trim().length < 3}
              aria-label="Enviar"
              title="Enviar"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full transition-smooth",
                loading || text.trim().length < 3
                  ? "cursor-not-allowed bg-background text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95",
              )}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      {ok && (
        <p className="mt-2 text-[11px] text-primary">
          Listo — revisá y ajustá los filtros abajo.
        </p>
      )}
      {err && <p className="mt-2 text-[11px] text-destructive">{err}</p>}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: readonly string[];
  value: string | null;
  onSelect: (v: string | null) => void;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "min-h-[44px] rounded-full border px-4 text-xs font-semibold transition-smooth",
            value === null
              ? "border-primary bg-primary/15 text-primary"
              : "border-dashed border-border bg-transparent text-muted-foreground hover:border-primary hover:text-primary",
          )}
        >
          ✨ Que decida la IA
        </button>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onSelect(active ? null : opt)}
              className={cn(
                "min-h-[44px] rounded-full border px-4 text-sm font-medium transition-smooth",
                active
                  ? "border-transparent bg-primary text-primary-foreground shadow-primary"
                  : "border-border bg-card/50 text-foreground/80 hover:bg-card",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== LOADING ===================== */

function LoadingScreen() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6 animate-fade-in">
      <div className="text-center">
        <div className="relative mx-auto mb-6 h-20 w-20">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-primary shadow-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary-foreground" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Buscando algo perfecto para vos…
        </h2>
      </div>
    </section>
  );
}

/* ===================== RESULTS ===================== */

function ResultsScreen({
  results,
  source,
  freeText,
  patternSuggestion,
  existingMoments,
  onBack,
  onSaveMoment,
  isGuest,
  excludedCount,
  onSeen,
  onFeedback,
  onRerunExcludingSeen,
  isGuestForFeedback,
  posters,
}: {
  results: RecommendationsResult;
  resolvedFilters: SituationFilters;
  source: "text" | "filters" | "moment";
  freeText: string;
  patternSuggestion: {
    time_filter: string | null;
    company_filter: string | null;
    mood_filter: string | null;
    type_filter: string | null;
    platforms: string[];
    count: number;
  } | null;
  existingMoments: MomentRow[];
  onBack: () => void;
  onSaveMoment: (name: string) => Promise<void>;
  isGuest: boolean;
  excludedCount: number;
  onSeen: (title: string, platform: string) => void;
  onFeedback: (title: string, platform: string, sentiment: "like" | "love") => void;
  onRerunExcludingSeen: () => void;
  isGuestForFeedback: boolean;
  posters: Record<string, string | null>;
}) {
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPattern, setShowPattern] = useState(true);

  // Estado local por tarjeta: "seen" (oculta), "like" o "love" (visible con badge).
  const [cardState, setCardState] = useState<Record<string, "seen" | "like" | "love">>({});
  // Cada vez que llegan resultados nuevos, reseteamos el estado local.
  useEffect(() => {
    setCardState({});
  }, [results]);

  const markSeen = (rec: Recommendation) => {
    setCardState((s) => ({ ...s, [rec.title]: "seen" }));
    onSeen(rec.title, rec.platform);
  };
  const markFeedback = (rec: Recommendation, sentiment: "like" | "love") => {
    setCardState((s) => ({ ...s, [rec.title]: sentiment }));
    onFeedback(rec.title, rec.platform, sentiment);
  };

  const allCards: Recommendation[] = [results.main, ...results.alternatives];
  const visibleCards = allCards.filter((r) => cardState[r.title] !== "seen");
  const visibleMain = visibleCards[0] ?? null;
  const visibleAlts = visibleCards.slice(1);
  const allDismissed = visibleCards.length === 0;

  const chips = useMemo(() => {
    return [
      results.filters.time,
      results.filters.company,
      results.filters.mood,
      results.filters.type,
    ].filter(Boolean) as string[];
  }, [results]);

  return (
    <section className="animate-fade-in pt-2">
      <button
        onClick={onBack}
        className="mb-4 inline-flex min-h-[40px] items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Buscar otra cosa
      </button>

      {source === "text" && freeText && (
        <div className="mb-3 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs text-muted-foreground">
          Entendimos: <span className="text-foreground">“{freeText}”</span>
        </div>
      )}

      {chips.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {results.clarification_needed && (
        <div className="mb-4 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground">
          {results.clarification_needed}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-primary">
          {source === "moment" ? "Para tu Momento, te recomendamos" : "Esta noche, ve"}
        </div>
        {excludedCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            Excluyendo {excludedCount} {excludedCount === 1 ? "ya vista" : "ya vistas"}
          </span>
        )}
      </div>

      {visibleMain && (
        <MainCard
          rec={visibleMain}
          posterUrl={posters[visibleMain.title] ?? null}
          feedback={cardState[visibleMain.title] ?? null}
          onSeen={() => markSeen(visibleMain)}
          onLike={() => markFeedback(visibleMain, "like")}
          onLove={() => markFeedback(visibleMain, "love")}
          allowFeedback={!isGuestForFeedback}
        />
      )}

      {visibleAlts.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-base font-semibold text-foreground">O si no…</h3>
          <div className="space-y-3">
            {visibleAlts.map((r) => (
              <AltCard
                key={r.title}
                rec={r}
                posterUrl={posters[r.title] ?? null}
                feedback={cardState[r.title] ?? null}
                onSeen={() => markSeen(r)}
                onLike={() => markFeedback(r, "like")}
                onLove={() => markFeedback(r, "love")}
                allowFeedback={!isGuestForFeedback}
              />
            ))}
          </div>
        </div>
      )}

      {/* CTA explícito para buscar otras opciones, una vez que ya marcaste algo */}
      {(Object.keys(cardState).length > 0 || allDismissed) && (
        <button
          onClick={onRerunExcludingSeen}
          className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-primary/50 bg-primary/10 px-5 text-sm font-semibold text-primary transition-smooth hover:bg-primary/20"
        >
          <RefreshCw className="h-4 w-4" />
          {allDismissed ? "Buscar otras opciones" : "Buscar más, excluyendo lo marcado"}
        </button>
      )}

      {/* Guardar Momento */}
      {source !== "moment" && !savedOnce && !isGuest && (
        <button
          onClick={() => setShowSaveModal(true)}
          className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-card/60 px-4 text-sm font-medium text-foreground transition-smooth hover:border-primary"
        >
          <Bookmark className="h-4 w-4" /> Guardar como Momento
        </button>
      )}
      {source !== "moment" && isGuest && (
        <Link
          to="/login"
          className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-dashed border-border bg-transparent px-4 text-sm font-medium text-muted-foreground transition-smooth hover:border-primary hover:text-primary"
        >
          <Bookmark className="h-4 w-4" /> Iniciá sesión para guardar este Momento
        </Link>
      )}
      {savedOnce && (
        <div className="mt-8 inline-flex items-center gap-2 text-sm text-primary">
          <Check className="h-4 w-4" /> Guardado en tus Momentos
        </div>
      )}

      {/* Sugerencia de patrón */}
      {showPattern &&
        patternSuggestion &&
        existingMoments.length < 12 &&
        !savedOnce && (
          <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/10 p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-sm text-foreground">
                Notamos que repetís esta combinación ({patternSuggestion.count} veces).
                ¿La guardás como Momento?
              </p>
              <button
                onClick={() => setShowPattern(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Descartar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => {
                setShowSaveModal(true);
                setShowPattern(false);
              }}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Crear Momento →
            </button>
          </div>
        )}

      {showSaveModal && (
        <SaveMomentModal
          defaultName={suggestNameFromFilters(results.filters)}
          onClose={() => setShowSaveModal(false)}
          onSave={async (name) => {
            setSaving(true);
            try {
              await onSaveMoment(name);
              setSavedOnce(true);
              setShowSaveModal(false);
            } finally {
              setSaving(false);
            }
          }}
          saving={saving}
        />
      )}
    </section>
  );
}

function suggestNameFromFilters(f: RecommendationsResult["filters"]): string {
  const parts = [f.time, f.company, f.mood, f.type].filter(Boolean) as string[];
  return parts.slice(0, 3).join(" · ") || "Mi Momento";
}

function SaveMomentModal({
  defaultName,
  onClose,
  onSave,
  saving,
}: {
  defaultName: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = useState(defaultName);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-6 pt-20 sm:items-center sm:pb-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-foreground">Nombrá tu Momento</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Ej: &quot;Martes noche, serie solo&quot;, &quot;Finde con María&quot;.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-4 min-h-[48px] w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="min-h-[44px] flex-1 rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-background"
          >
            Cancelar
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim())}
            disabled={saving || !name.trim()}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-primary disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const color = colorForPlatform(platform);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"
      style={{ background: color }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
      {platform}
    </span>
  );
}

type CardFeedback = "seen" | "like" | "love" | null;

function FeedbackRow({
  feedback,
  onSeen,
  onLike,
  onLove,
  allowFeedback,
  size = "md",
}: {
  feedback: CardFeedback;
  onSeen: () => void;
  onLike: () => void;
  onLove: () => void;
  allowFeedback: boolean;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "min-h-[36px] text-[11px] px-3" : "min-h-[40px] text-xs px-3.5";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  if (feedback === "like" || feedback === "love") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 text-xs font-semibold",
          feedback === "love"
            ? "border-accent/60 bg-accent/15 text-accent"
            : "border-primary/50 bg-primary/10 text-primary",
          size === "sm" ? "min-h-[36px]" : "min-h-[40px]",
        )}
      >
        <Heart
          className={cn(iconSize, feedback === "love" && "fill-current")}
        />
        {feedback === "love" ? "Te encanta" : "Te gusta"} — lo recordamos
      </span>
    );
  }

  return (
    <>
      {allowFeedback && (
        <>
          <button
            onClick={onLike}
            title="Me gusta — algo así me sirve"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 font-semibold text-muted-foreground transition-smooth hover:border-primary hover:text-primary",
              h,
            )}
          >
            <ThumbsUp className={iconSize} />
            Me gusta
          </button>
          <button
            onClick={onLove}
            title="Me encanta — enseñale al motor mi gusto"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/5 font-semibold text-accent transition-smooth hover:bg-accent/15",
              h,
            )}
          >
            <Heart className={iconSize} />
            Me encanta
          </button>
        </>
      )}
      <button
        onClick={onSeen}
        title="Ya la vi — sacala de los resultados"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent font-semibold text-muted-foreground transition-smooth hover:border-primary hover:text-primary",
          h,
        )}
      >
        <EyeOff className={iconSize} />
        Ya la vi
      </button>
    </>
  );
}

function MainCard({
  rec,
  posterUrl,
  feedback,
  onSeen,
  onLike,
  onLove,
  allowFeedback,
}: {
  rec: Recommendation;
  posterUrl: string | null;
  feedback: CardFeedback;
  onSeen: () => void;
  onLike: () => void;
  onLove: () => void;
  allowFeedback: boolean;
}) {
  return (
    <article
      className="overflow-hidden rounded-3xl border bg-card shadow-card"
      style={{ borderColor: `${colorForPlatform(rec.platform)}55` }}
    >
      {posterUrl && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-muted/40">
          <img
            src={posterUrl}
            alt={`Portada de ${rec.title}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <PlatformBadge platform={rec.platform} />
          <span className="text-xs text-muted-foreground">
            {rec.type} · {rec.duration}
          </span>
        </div>
        <h2 className="text-3xl font-bold leading-tight text-foreground">{rec.title}</h2>
        <p className="mt-4 text-sm leading-relaxed text-foreground/85">{rec.reason}</p>
        <a
          href={deepLinkFor(rec.platform, rec.title)}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold text-white shadow-primary transition-smooth active:scale-[0.98]"
          style={{ background: colorForPlatform(rec.platform) }}
        >
          <Play className="h-4 w-4 fill-current" />
          Ver ahora en {rec.platform}
        </a>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FeedbackRow
            feedback={feedback}
            onSeen={onSeen}
            onLike={onLike}
            onLove={onLove}
            allowFeedback={allowFeedback}
          />
        </div>
      </div>
    </article>
  );
}

function AltCard({
  rec,
  posterUrl,
  feedback,
  onSeen,
  onLike,
  onLove,
  allowFeedback,
}: {
  rec: Recommendation;
  posterUrl: string | null;
  feedback: CardFeedback;
  onSeen: () => void;
  onLike: () => void;
  onLove: () => void;
  allowFeedback: boolean;
}) {
  return (
    <article className="flex gap-3 rounded-2xl border border-border bg-card/60 p-3">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={`Portada de ${rec.title}`}
          loading="lazy"
          className="h-24 w-16 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="h-24 w-16 flex-shrink-0 rounded-lg bg-muted/40" />
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <PlatformBadge platform={rec.platform} />
          <span className="text-[11px] text-muted-foreground">
            {rec.type} · {rec.duration}
          </span>
        </div>
        <h3 className="text-lg font-semibold leading-tight text-foreground">{rec.title}</h3>
        <p className="mt-1.5 text-sm text-foreground/75">{rec.reason}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={deepLinkFor(rec.platform, rec.title)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-border px-4 text-xs font-semibold text-foreground transition-smooth hover:border-primary hover:text-primary"
          >
            <Play className="h-3 w-3 fill-current" />
            Ver en {rec.platform}
          </a>
          <FeedbackRow
            feedback={feedback}
            onSeen={onSeen}
            onLike={onLike}
            onLove={onLove}
            allowFeedback={allowFeedback}
            size="sm"
          />
        </div>
      </div>
    </article>
  );
}
