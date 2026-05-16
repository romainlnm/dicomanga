-- ============================================================================
-- Dico.Manga — Support des images dans les messages (privés + publics)
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. MESSAGES PRIVÉS : ajouter image_url et autoriser content NULL ----------
ALTER TABLE public.messages
  ALTER COLUMN content DROP NOT NULL;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS content_length;
ALTER TABLE public.messages
  ADD CONSTRAINT content_length
    CHECK (content IS NULL OR char_length(content) BETWEEN 1 AND 2000);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS message_has_content_or_image;
ALTER TABLE public.messages
  ADD CONSTRAINT message_has_content_or_image
    CHECK (content IS NOT NULL OR image_url IS NOT NULL);


-- 2. MESSAGES PUBLICS : pareil ----------------------------------------------
ALTER TABLE public.public_messages
  ALTER COLUMN content DROP NOT NULL;

ALTER TABLE public.public_messages
  DROP CONSTRAINT IF EXISTS public_messages_content_check;
ALTER TABLE public.public_messages
  DROP CONSTRAINT IF EXISTS public_content_length;
ALTER TABLE public.public_messages
  ADD CONSTRAINT public_content_length
    CHECK (content IS NULL OR char_length(content) BETWEEN 1 AND 2000);

ALTER TABLE public.public_messages
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.public_messages
  DROP CONSTRAINT IF EXISTS public_message_has_content_or_image;
ALTER TABLE public.public_messages
  ADD CONSTRAINT public_message_has_content_or_image
    CHECK (content IS NOT NULL OR image_url IS NOT NULL);


-- 3. STORAGE BUCKET : chat-images (public en lecture) -----------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;


-- 4. STORAGE POLICIES -------------------------------------------------------
-- Lecture publique (les URLs sont des UUID, et le chat public est ouvert).
DROP POLICY IF EXISTS "chat_images_read_all" ON storage.objects;
CREATE POLICY "chat_images_read_all"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'chat-images');

-- Upload : l'utilisateur doit déposer son fichier dans son propre dossier {auth.uid()}/...
DROP POLICY IF EXISTS "chat_images_upload_own" ON storage.objects;
CREATE POLICY "chat_images_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Suppression de ses propres fichiers
DROP POLICY IF EXISTS "chat_images_delete_own" ON storage.objects;
CREATE POLICY "chat_images_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
