// Clima opcional via geolocalización del navegador + Open-Meteo (sin API key).
// Se cachea en localStorage por 30 minutos para no spamear permisos ni red.

export type WeatherSnapshot = {
  tempC: number;
  isDay: boolean;
  conditionCode: number; // WMO weather code
  condition: string; // ej. "nublado", "lluvia ligera"
  fetchedAt: number; // epoch ms
};

const CACHE_KEY = "queveo:weather:last";
const PERMISSION_KEY = "queveo:weather:enabled";
const TTL_MS = 30 * 60 * 1000;

export function isWeatherEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PERMISSION_KEY) === "1";
}

export function setWeatherEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) localStorage.setItem(PERMISSION_KEY, "1");
  else {
    localStorage.removeItem(PERMISSION_KEY);
    localStorage.removeItem(CACHE_KEY);
  }
}

function describeWmo(code: number): string {
  // https://open-meteo.com/en/docs (WMO codes resumidos al español)
  if (code === 0) return "despejado";
  if (code === 1) return "mayormente despejado";
  if (code === 2) return "parcialmente nublado";
  if (code === 3) return "nublado";
  if (code === 45 || code === 48) return "niebla";
  if (code >= 51 && code <= 57) return "llovizna";
  if (code >= 61 && code <= 67) return "lluvia";
  if (code >= 71 && code <= 77) return "nieve";
  if (code >= 80 && code <= 82) return "chubascos";
  if (code >= 85 && code <= 86) return "chubascos de nieve";
  if (code >= 95) return "tormenta";
  return "condición desconocida";
}

function readCache(): WeatherSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherSnapshot;
    if (Date.now() - parsed.fetchedAt > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocalización no disponible en este navegador."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 10 * 60 * 1000,
      timeout: 8000,
    });
  });
}

/**
 * Devuelve el clima actual. Si ya hay caché fresca, no pide permisos ni red.
 * Si falla (permiso denegado, sin red, etc.), devuelve null silenciosamente.
 */
export async function getWeatherSnapshot(): Promise<WeatherSnapshot | null> {
  const cached = readCache();
  if (cached) return cached;
  try {
    const pos = await getPosition();
    const { latitude, longitude } = pos.coords;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(
      2,
    )}&longitude=${longitude.toFixed(2)}&current=temperature_2m,weather_code,is_day&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const json = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number; is_day?: number };
    };
    const c = json.current;
    if (!c || typeof c.temperature_2m !== "number" || typeof c.weather_code !== "number") {
      return null;
    }
    const snap: WeatherSnapshot = {
      tempC: Math.round(c.temperature_2m),
      isDay: c.is_day === 1,
      conditionCode: c.weather_code,
      condition: describeWmo(c.weather_code),
      fetchedAt: Date.now(),
    };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(snap));
    } catch {
      /* storage lleno o no disponible — ignorar */
    }
    return snap;
  } catch {
    return null;
  }
}

export function weatherHintShort(w: WeatherSnapshot): string {
  return `${w.condition}, ${w.tempC}°C, ${w.isDay ? "de día" : "de noche"}`;
}
