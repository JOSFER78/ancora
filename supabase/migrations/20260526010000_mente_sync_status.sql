ALTER TABLE IF EXISTS public.mente_sources
  ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'analyzed', 'error')),
  ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS analysis_run_id TEXT,
  ADD COLUMN IF NOT EXISTS extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS extraction_status TEXT NOT NULL DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'ready', 'error')),
  ADD COLUMN IF NOT EXISTS extraction_model TEXT,
  ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS extraction_error TEXT;

ALTER TABLE IF EXISTS public.conversations
  ADD COLUMN IF NOT EXISTS context_sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (context_sync_status IN ('pending', 'analyzed', 'error')),
  ADD COLUMN IF NOT EXISTS context_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS context_sync_run_id TEXT;

DO $$
BEGIN
  IF to_regclass('public.mente_sources') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'mente_sources'
         AND column_name = 'processed'
     ) THEN
    UPDATE public.mente_sources
       SET sync_status = CASE WHEN processed IS TRUE THEN 'analyzed' ELSE 'pending' END,
           analyzed_at = CASE WHEN processed IS TRUE THEN COALESCE(analyzed_at, created_at, now()) ELSE analyzed_at END
     WHERE sync_status = 'pending';
  END IF;

  IF to_regclass('public.mente_sources') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_mente_sources_user_sync_status
      ON public.mente_sources(user_id, sync_status, created_at);
  END IF;

  IF to_regclass('public.conversations') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_user_context_sync
      ON public.conversations(user_id, status, context_sync_status, closed_at);
  END IF;
END $$;
