/**
 * Sugerencias de búsqueda contextuales para la home.
 * Genera un puñado de frases "tap-to-search" que cambian según el momento
 * (hora, fin de semana, estación) y el clima, para ahorrarle al usuario
 * tener que escribir. Inspirado en las tarjetas de casos de uso de Copilot.
 */
import type { TimeContext } from "@/lib/context";
import type { WeatherSnapshot } from "@/lib/environment";

export type Suggestion = {
  /** Texto corto que se muestra en el chip. */
  label: string;
  /** Frase completa que se envía al motor de recomendaciones. */
  query: string;
};

const LATE_NIGHT: Suggestion[] = [
  { label: "🌙 Algo liviano para cerrar el día", query: "algo liviano y corto para ver antes de dormir" },
  { label: "😱 Terror para trasnochar", query: "una de terror para ver de madrugada" },
  { label: "🔁 Serie de capítulos cortos", query: "una serie con capítulos cortos para enganchar" },
];

const EVENING: Suggestion[] = [
  { label: "🍿 Peli para la cena", query: "una película entretenida para ver durante la cena" },
  { label: "🎬 Algo que valga la pena", query: "una película muy bien valorada que no haya visto" },
  { label: "😂 Comedia para distender", query: "una comedia para reírme y relajarme" },
];

const WEEKEND: Suggestion[] = [
  { label: "🛋️ Maratón de fin de semana", query: "una serie para maratonear todo el fin de semana" },
  { label: "🎯 Un peliculón de acción", query: "una de acción con mucha adrenalina" },
  { label: "👨‍👩‍👧 Algo para ver en familia", query: "una película para ver en familia" },
];

const WEEKDAY: Suggestion[] = [
  { label: "⏱️ Algo cortito para hoy", query: "una película de menos de 100 minutos" },
  { label: "🧠 Algo que me haga pensar", query: "una película inteligente con buen guion" },
  { label: "❤️ Para llorar un poco", query: "un drama emotivo para llorar" },
];

const SEASON: Record<TimeContext["season"], Suggestion> = {
  invierno: { label: "☕ Plan de manta y sillón", query: "algo acogedor para ver con frío" },
  verano: { label: "🌅 Algo fresco y luminoso", query: "una película fresca y divertida de verano" },
  otoño: { label: "🍂 Una historia con melancolía", query: "una película melancólica y atmosférica" },
  primavera: { label: "🌸 Algo que levante el ánimo", query: "una película feel-good que levante el ánimo" },
};

/**
 * Deriva una sugerencia del clima. `condition` es una descripción en español
 * (ej. "lluvia", "tormenta", "nieve", "despejado"); también usamos `tempC`
 * para captar frío/calor cuando no hay un fenómeno marcado.
 */
function weatherSuggestion(w: WeatherSnapshot): Suggestion | undefined {
  const c = w.condition.toLowerCase();
  if (c.includes("tormenta"))
    return { label: "⛈️ Algo intenso para la tormenta", query: "un thriller intenso para una noche de tormenta" };
  if (c.includes("nieve"))
    return { label: "❄️ Clásico para un día de nieve", query: "una película clásica y cálida para un día de nieve" };
  if (c.includes("lluvia") || c.includes("llovizna") || c.includes("chubasco"))
    return { label: "🌧️ Perfecta para la lluvia", query: "una película ideal para un día de lluvia" };
  if (w.tempC <= 12)
    return { label: "☕ Plan de manta y sillón", query: "algo acogedor para ver con frío" };
  if (w.tempC >= 30)
    return { label: "🧊 Algo ligero para el calor", query: "una comedia ligera para un día caluroso" };
  return undefined;
}

/**
 * Devuelve hasta `max` sugerencias contextuales sin repetir labels.
 */
export function getContextualSuggestions(
  ctx: TimeContext,
  weather: WeatherSnapshot | null,
  max = 4,
): Suggestion[] {
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  const push = (s: Suggestion | undefined) => {
    if (!s || seen.has(s.label) || out.length >= max) return;
    seen.add(s.label);
    out.push(s);
  };

  // 1) Clima primero (lo más "vivo" y específico)
  if (weather) push(weatherSuggestion(weather));

  // 2) Momento del día
  const timeBank = ctx.isLate ? LATE_NIGHT : ctx.isEvening ? EVENING : ctx.isWeekend ? WEEKEND : WEEKDAY;
  push(timeBank[0]);

  // 3) Estación
  push(SEASON[ctx.season]);

  // 4) Completar con el resto del banco del momento + finde/semana
  for (const s of [...timeBank.slice(1), ...(ctx.isWeekend ? WEEKEND : WEEKDAY)]) push(s);

  return out.slice(0, max);
}
