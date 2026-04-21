-- ============================================================================
-- Dico.Manga — Public chat (salon unique)
-- Idempotent : peut être rejoué sans erreur.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.public_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS public_messages_created_idx
  ON public.public_messages (created_at DESC);

ALTER TABLE public.public_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_messages_select_all" ON public.public_messages;
CREATE POLICY "public_messages_select_all"
  ON public.public_messages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "public_messages_insert_self" ON public.public_messages;
CREATE POLICY "public_messages_insert_self"
  ON public.public_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "public_messages_delete_self" ON public.public_messages;
CREATE POLICY "public_messages_delete_self"
  ON public.public_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- ===== Signalement de messages publics =====

CREATE TABLE IF NOT EXISTS public.public_message_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id       UUID NOT NULL REFERENCES public.public_messages(id) ON DELETE CASCADE,
  reporter_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed         BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (message_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS public_message_reports_unreviewed_idx
  ON public.public_message_reports (created_at DESC) WHERE reviewed = false;

ALTER TABLE public.public_message_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_reports_select_own" ON public.public_message_reports;
CREATE POLICY "public_reports_select_own"
  ON public.public_message_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "public_reports_insert_self" ON public.public_message_reports;
CREATE POLICY "public_reports_insert_self"
  ON public.public_message_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reporter_id
    AND auth.uid() <> reported_user_id
    AND EXISTS (
      SELECT 1 FROM public.public_messages m
      WHERE m.id = message_id
        AND m.sender_id = reported_user_id
    )
  );

-- ===== Realtime =====
-- Ajoute public_messages au stream realtime pour recevoir les INSERT en direct.
-- (Ignore l'erreur si déjà ajoutée.)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.public_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
