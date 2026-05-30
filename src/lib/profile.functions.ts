import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type FeedbackSentiment = "seen" | "like" | "love" | "dislike";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("default_platforms, age_bracket, seed_loved")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      default_platforms: (data?.default_platforms ?? []) as string[],
      age_bracket: (data?.age_bracket ?? null) as string | null,
      seed_loved: (data?.seed_loved ?? []) as string[],
    };
  });

export const setDefaultPlatforms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ platforms: z.array(z.string().min(1).max(40)).max(10) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, default_platforms: data.platforms });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAgeBracket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ ageBracket: z.enum(["18-29", "30-45", "46+"]).nullable() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, age_bracket: data.ageBracket });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Conteos exactos del feedback del usuario, para la sección de actividad. */
export const getTasteCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("title_feedback")
      .select("sentiment")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const counts = { loved: 0, liked: 0, disliked: 0, seen: 0 };
    for (const row of (data ?? []) as { sentiment: FeedbackSentiment }[]) {
      if (row.sentiment === "love") counts.loved++;
      else if (row.sentiment === "like") counts.liked++;
      else if (row.sentiment === "dislike") counts.disliked++;
      else if (row.sentiment === "seen") counts.seen++;
    }
    return counts;
  });

/** Elimina permanentemente la cuenta del usuario (RPC security definer). */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.rpc("delete_user");
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const migrateSeedSchema = z.object({
  ageBracket: z.enum(["18-29", "30-45", "46+"]).nullable().optional(),
  lovedTitles: z.array(z.string().min(1).max(200)).max(8).optional().default([]),
});

export const migrateGuestSeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => migrateSeedSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: current } = await context.supabase
      .from("profiles")
      .select("age_bracket, seed_loved")
      .eq("id", context.userId)
      .maybeSingle();

    const patch: { id: string; age_bracket?: string | null; seed_loved?: string[] } = {
      id: context.userId,
    };
    if (!current?.age_bracket && data.ageBracket) {
      patch.age_bracket = data.ageBracket;
    }
    const existingLoved = (current?.seed_loved ?? []) as string[];
    if (existingLoved.length === 0 && data.lovedTitles && data.lovedTitles.length > 0) {
      patch.seed_loved = data.lovedTitles;
    }

    if (!patch.age_bracket && !patch.seed_loved) {
      return { migrated: false };
    }

    const { error } = await context.supabase.from("profiles").upsert(patch);
    if (error) throw new Error(error.message);
    return { migrated: true };
  });
