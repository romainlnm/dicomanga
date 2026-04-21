-- ============================================================================
-- Dico.Manga — Message reports (signalement)
-- Ce script est idempotent : il peut être rejoué sans erreur.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.message_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id       UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  reporter_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed         BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (message_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS message_reports_unreviewed_idx
  ON public.message_reports (created_at DESC) WHERE reviewed = false;

ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_own" ON public.message_reports;
CREATE POLICY "reports_select_own"
  ON public.message_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_insert_if_recipient" ON public.message_reports;
CREATE POLICY "reports_insert_if_recipient"
  ON public.message_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reporter_id
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
        AND m.recipient_id = auth.uid()
        AND m.sender_id = reported_user_id
    )
  );
