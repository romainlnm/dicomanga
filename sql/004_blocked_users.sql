-- ============================================================================
-- Dico.Manga — Blocage d'utilisateurs
-- Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blocked_users (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS blocked_users_blocker_idx
  ON public.blocked_users (blocker_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_users_select_own" ON public.blocked_users;
CREATE POLICY "blocked_users_select_own"
  ON public.blocked_users FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "blocked_users_insert_self" ON public.blocked_users;
CREATE POLICY "blocked_users_insert_self"
  ON public.blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "blocked_users_delete_self" ON public.blocked_users;
CREATE POLICY "blocked_users_delete_self"
  ON public.blocked_users FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Empêche un utilisateur bloqué d'envoyer un DM à son bloqueur
-- (le bloqueur ne voit plus ses messages côté client, mais c'est mieux
-- que de laisser l'insert réussir silencieusement).
DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = recipient_id AND blocked_id = auth.uid()
    )
  );

-- Pareil pour le salon public : un utilisateur ne peut pas spammer
-- un salon où il a été globalement signalé. (Pas implémenté ici — on
-- se contente de filtrer côté client dans le salon public.)
