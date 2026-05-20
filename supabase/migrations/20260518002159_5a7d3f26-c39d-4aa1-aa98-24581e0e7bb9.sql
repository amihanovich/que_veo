CREATE TABLE public.title_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  platform text,
  sentiment text NOT NULL CHECK (sentiment IN ('seen','like','love')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_title_feedback_user_sentiment ON public.title_feedback(user_id, sentiment, created_at DESC);
CREATE UNIQUE INDEX uniq_title_feedback_user_title_sentiment ON public.title_feedback(user_id, lower(title), sentiment);

ALTER TABLE public.title_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "title_feedback_select_own" ON public.title_feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "title_feedback_insert_own" ON public.title_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "title_feedback_delete_own" ON public.title_feedback
  FOR DELETE TO authenticated USING (auth.uid() = user_id);