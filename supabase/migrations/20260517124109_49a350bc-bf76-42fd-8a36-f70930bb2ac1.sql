
-- 1. Profiles: una fila por usuario, con plataformas favoritas por defecto
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_platforms TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Moments: templates guardados por el usuario. Cualquier filtro NULL = "elegí por mí"
CREATE TABLE public.moments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  time_filter TEXT,
  company_filter TEXT,
  mood_filter TEXT,
  type_filter TEXT,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  auto_detected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_moments_user ON public.moments(user_id, created_at DESC);
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moments_select_own" ON public.moments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "moments_insert_own" ON public.moments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moments_update_own" ON public.moments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "moments_delete_own" ON public.moments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Search history: para detectar patrones repetidos
CREATE TABLE public.search_history (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('text', 'filters', 'moment')),
  prompt_text TEXT,
  time_filter TEXT,
  company_filter TEXT,
  mood_filter TEXT,
  type_filter TEXT,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_search_history_user_date ON public.search_history(user_id, created_at DESC);
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "history_select_own" ON public.search_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "history_insert_own" ON public.search_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4. Trigger genérico para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_moments_updated BEFORE UPDATE ON public.moments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Auto-crear profile al registrarse un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
