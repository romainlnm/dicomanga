-- ============================================================================
-- Dico.Manga — Reactions on manga comments
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)
-- Idempotent: safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.manga_comment_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  UUID NOT NULL REFERENCES public.manga_comments(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT comment_emoji_length CHECK (char_length(emoji) BETWEEN 1 AND 16),
  UNIQUE (comment_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS manga_comment_reactions_comment_idx
  ON public.manga_comment_reactions (comment_id);

ALTER TABLE public.manga_comment_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment_reactions_select_all" ON public.manga_comment_reactions;
CREATE POLICY "comment_reactions_select_all"
  ON public.manga_comment_reactions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "comment_reactions_insert_self" ON public.manga_comment_reactions;
CREATE POLICY "comment_reactions_insert_self"
  ON public.manga_comment_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comment_reactions_delete_self" ON public.manga_comment_reactions;
CREATE POLICY "comment_reactions_delete_self"
  ON public.manga_comment_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
