const KEY = "queveo:guest:seed";

export interface GuestSeed {
  searchCount: number;
  loginNudgeDismissedAt: string | null;
  favoriteTitles: string[];
  ageGroup: string | null;
}

const DEFAULT: GuestSeed = {
  searchCount: 0,
  loginNudgeDismissedAt: null,
  favoriteTitles: [],
  ageGroup: null,
};

export function readGuestSeed(): GuestSeed {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

function writeGuestSeed(seed: GuestSeed): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(seed));
  } catch {}
}

export function isOnboarded(): boolean {
  const seed = readGuestSeed();
  return seed.favoriteTitles.length > 0 || seed.ageGroup !== null;
}

export function bumpSearchCount(): void {
  const seed = readGuestSeed();
  writeGuestSeed({ ...seed, searchCount: seed.searchCount + 1 });
}

export function dismissLoginNudge(): void {
  const seed = readGuestSeed();
  writeGuestSeed({ ...seed, loginNudgeDismissedAt: new Date().toISOString() });
}

export function saveOnboarding(ageGroup: string | null, favoriteTitles: string[]): void {
  const seed = readGuestSeed();
  writeGuestSeed({ ...seed, ageGroup, favoriteTitles });
}

export function seedForServer(seed: GuestSeed): string | undefined {
  const parts: string[] = [];
  if (seed.ageGroup) parts.push(`Grupo etario: ${seed.ageGroup}`);
  if (seed.favoriteTitles.length > 0)
    parts.push(`Títulos favoritos del invitado: ${seed.favoriteTitles.join(", ")}`);
  if (parts.length === 0) return undefined;
  return `Perfil del invitado (sin cuenta registrada):\n- ${parts.join("\n- ")}`;
}
