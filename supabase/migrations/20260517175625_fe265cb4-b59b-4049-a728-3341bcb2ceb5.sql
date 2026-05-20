ALTER TABLE public.moments
  ADD COLUMN IF NOT EXISTS attention_filter text,
  ADD COLUMN IF NOT EXISTS novelty_filter text,
  ADD COLUMN IF NOT EXISTS season_hint text,
  ADD COLUMN IF NOT EXISTS weather_hint text,
  ADD COLUMN IF NOT EXISTS use_location boolean NOT NULL DEFAULT false;

ALTER TABLE public.search_history
  ADD COLUMN IF NOT EXISTS attention_filter text,
  ADD COLUMN IF NOT EXISTS novelty_filter text,
  ADD COLUMN IF NOT EXISTS season_hint text,
  ADD COLUMN IF NOT EXISTS weather_hint text;