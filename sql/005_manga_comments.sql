-- ============================================================================
-- Dico.Manga — Manga comments schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.manga_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id   INTEGER NOT NULL,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT manga_comment_length CHECK (char_length(content) BETWEEN 1 AND 10000)
);

CREATE INDEX IF NOT EXISTS manga_comments_manga_created_idx
  ON public.manga_comments (manga_id, created_at DESC);

ALTER TABLE public.manga_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.manga_comments;
CREATE POLICY "Comments viewable by everyone"
  ON public.manga_comments FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert their own comments" ON public.manga_comments;
CREATE POLICY "Authenticated users can insert their own comments"
  ON public.manga_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.manga_comments;
CREATE POLICY "Users can delete their own comments"
  ON public.manga_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
