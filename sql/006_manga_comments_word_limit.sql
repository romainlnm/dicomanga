-- ============================================================================
-- Dico.Manga — Relax manga_comments length constraint
-- Front-end now limits comments to 1000 words (~10 000 caractères max).
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================================

ALTER TABLE public.manga_comments
  DROP CONSTRAINT IF EXISTS manga_comment_length;

ALTER TABLE public.manga_comments
  ADD CONSTRAINT manga_comment_length
  CHECK (char_length(content) BETWEEN 1 AND 10000);
