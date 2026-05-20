// Utilidades de contexto temporal (cliente)
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export type Season = "verano" | "otoño" | "invierno" | "primavera";
export type Hemisphere = "norte" | "sur";

export type TimeContext = {
  dayOfWeek: string;
  hour: number;
  minutes: number;
  isWeekend: boolean;
  isLate: boolean; // ≥ 22h
  isEvening: boolean; // 18-22h
  season: Season;
  hemisphere: Hemisphere;
  label: string; // ej. "martes 23:14"
};

/**
 * Hemisferio inferido desde la zona horaria del navegador.
 * Es un heurístico simple pero suficiente: cualquier TZ que empiece por
 * "America/Argentina", "America/Sao_Paulo", "Australia/...", "Pacific/Auckland",
 * "Africa/Johannesburg", etc. → sur. El resto → norte.
 */
function inferHemisphere(): Hemisphere {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const southPrefixes = [
      "America/Argentina",
      "America/Sao_Paulo",
      "America/Montevideo",
      "America/Asuncion",
      "America/Santiago",
      "America/La_Paz",
      "America/Lima",
      "Australia/",
      "Pacific/Auckland",
      "Pacific/Fiji",
      "Africa/Johannesburg",
      "Antarctica/",
    ];
    if (southPrefixes.some((p) => tz.startsWith(p))) return "sur";
    return "norte";
  } catch {
    return "norte";
  }
}

function seasonForMonth(month0: number, hemi: Hemisphere): Season {
  // month0: 0=ene .. 11=dic. Norte: dic-feb invierno, etc.
  const northern: Season[] = [
    "invierno", "invierno", "primavera", "primavera", "primavera", "verano",
    "verano", "verano", "otoño", "otoño", "otoño", "invierno",
  ];
  const southern: Season[] = [
    "verano", "verano", "otoño", "otoño", "otoño", "invierno",
    "invierno", "invierno", "primavera", "primavera", "primavera", "verano",
  ];
  return (hemi === "sur" ? southern : northern)[month0];
}

export function inferContext(now: Date = new Date()): TimeContext {
  const day = now.getDay();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const dayName = DAYS[day];
  const hemisphere = inferHemisphere();
  const season = seasonForMonth(now.getMonth(), hemisphere);
  return {
    dayOfWeek: dayName,
    hour,
    minutes,
    isWeekend: day === 0 || day === 6,
    isLate: hour >= 22 || hour < 4,
    isEvening: hour >= 18 && hour < 22,
    season,
    hemisphere,
    label: `${dayName} ${hour.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`,
  };
}

export function contextToPromptHint(ctx: TimeContext): string {
  const parts = [
    `Es ${ctx.dayOfWeek}, ${ctx.hour}:${ctx.minutes.toString().padStart(2, "0")}.`,
    `Estación: ${ctx.season} (hemisferio ${ctx.hemisphere}).`,
  ];
  if (ctx.isWeekend) parts.push("Es fin de semana.");
  if (ctx.isLate) parts.push("Es tarde por la noche — favorecer contenido más corto (capítulo de serie ~45min, no maratones).");
  else if (ctx.isEvening) parts.push("Es horario de noche típico.");
  return parts.join(" ");
}

export function seasonHintShort(ctx: TimeContext): string {
  return `${ctx.season} (${ctx.hemisphere})`;
}
