import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        type: z.string().min(1).max(40),
      }),
    )
    .min(1)
    .max(6),
});

type ITunesResult = {
  artworkUrl100?: string;
  trackName?: string;
  collectionName?: string;
};
type ITunesResponse = { results?: ITunesResult[] };

function upscale(url: string): string {
  // iTunes returns 100x100; replace with 600x600 (jpg works for both movie/tv)
  return url.replace(/\/\d+x\d+(bb)?\.(jpg|png|webp)$/i, "/600x600bb.jpg");
}

function isSeries(type: string): boolean {
  const t = type.toLowerCase();
  return t.includes("serie") || t.includes("capítulo") || t.includes("capitulo");
}

async function searchOne(
  title: string,
  entity: "movie" | "tvShow",
  country: string,
): Promise<string | null> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    title,
  )}&entity=${entity}&limit=1&country=${country}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as ITunesResponse;
    const art = data.results?.[0]?.artworkUrl100;
    return art ? upscale(art) : null;
  } catch {
    return null;
  }
}

async function fetchPosterForTitle(title: string, type: string): Promise<string | null> {
  const entity: "movie" | "tvShow" = isSeries(type) ? "tvShow" : "movie";
  // Try US first (catálogo más amplio), luego AR como fallback.
  return (
    (await searchOne(title, entity, "us")) ??
    (await searchOne(title, entity, "ar")) ??
    // Fallback al otro tipo por si la IA se equivocó.
    (await searchOne(title, entity === "movie" ? "tvShow" : "movie", "us"))
  );
}

export const fetchPosters = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const entries = await Promise.all(
      data.items.map(async (it) => {
        const poster = await fetchPosterForTitle(it.title, it.type);
        return [it.title, poster] as const;
      }),
    );
    const posters: Record<string, string | null> = {};
    for (const [t, p] of entries) posters[t] = p;
    return { posters };
  });
