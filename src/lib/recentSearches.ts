/**
 * Historial de últimas búsquedas del usuario, en localStorage.
 * Se muestra en la home como chips reclickeables para repetir una búsqueda
 * sin tener que reescribirla (análogo al "continuar" de Copilot).
 * Funciona igual para invitados y usuarios logueados.
 */
const KEY = "cinefilo:recent_searches";
const MAX = 6;

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((t): t is string => typeof t === "string").slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

/** Agrega una búsqueda al tope, deduplicando (case-insensitive) y recortando. */
export function pushRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (trimmed.length < 2 || typeof window === "undefined") return readRecentSearches();
  try {
    const current = readRecentSearches();
    const deduped = current.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
    const next = [trimmed, ...deduped].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return readRecentSearches();
  }
}

export function clearRecentSearches() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
