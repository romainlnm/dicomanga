-- ============================================================================
-- Dico.Manga — Reactions on chat messages (private DMs + public room)
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. PRIVATE MESSAGE REACTIONS ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT emoji_length CHECK (char_length(emoji) BETWEEN 1 AND 16),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS message_reactions_message_idx
  ON public.message_reactions (message_id);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select_if_can_see_msg" ON public.message_reactions;
CREATE POLICY "reactions_select_if_can_see_msg"
  ON public.message_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
        AND (auth.uid() = m.sender_id OR auth.uid() = m.recipient_id)
    )
  );

DROP POLICY IF EXISTS "reactions_insert_self_if_can_see_msg" ON public.message_reactions;
CREATE POLICY "reactions_insert_self_if_can_see_msg"
  ON public.message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
        AND (auth.uid() = m.sender_id OR auth.uid() = m.recipient_id)
    )
  );

DROP POLICY IF EXISTS "reactions_delete_self" ON public.message_reactions;
CREATE POLICY "reactions_delete_self"
  ON public.message_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- 2. PUBLIC MESSAGE REACTIONS -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.public_message_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID NOT NULL REFERENCES public.public_messages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT public_emoji_length CHECK (char_length(emoji) BETWEEN 1 AND 16),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS public_message_reactions_message_idx
  ON public.public_message_reactions (message_id);

ALTER TABLE public.public_message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_reactions_select_all" ON public.public_message_reactions;
CREATE POLICY "public_reactions_select_all"
  ON public.public_message_reactions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "public_reactions_insert_self" ON public.public_message_reactions;
CREATE POLICY "public_reactions_insert_self"
  ON public.public_message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "public_reactions_delete_self" ON public.public_message_reactions;
CREATE POLICY "public_reactions_delete_self"
  ON public.public_message_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- 3. REALTIME ---------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.public_message_reactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
