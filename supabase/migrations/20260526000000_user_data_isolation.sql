ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS app_config JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF to_regclass('public.conversations') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "Users can manage own conversations" ON public.conversations;
    EXECUTE 'CREATE POLICY "Users can manage own conversations" ON public.conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;

  IF to_regclass('public.messages') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "Users can read own conversation messages" ON public.messages;
    DROP POLICY IF EXISTS "Users can insert own conversation messages" ON public.messages;
    DROP POLICY IF EXISTS "Users can update own conversation messages" ON public.messages;
    DROP POLICY IF EXISTS "Users can delete own conversation messages" ON public.messages;
    EXECUTE 'CREATE POLICY "Users can read own conversation messages" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))';
    EXECUTE 'CREATE POLICY "Users can insert own conversation messages" ON public.messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))';
    EXECUTE 'CREATE POLICY "Users can update own conversation messages" ON public.messages FOR UPDATE USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))';
    EXECUTE 'CREATE POLICY "Users can delete own conversation messages" ON public.messages FOR DELETE USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))';
  END IF;

  IF to_regclass('public.mente_sources') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.mente_sources ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "Users can manage own mente sources" ON public.mente_sources;
    EXECUTE 'CREATE POLICY "Users can manage own mente sources" ON public.mente_sources FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;

  IF to_regclass('public.expenses') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "Users can manage own expenses" ON public.expenses;
    EXECUTE 'CREATE POLICY "Users can manage own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;

  IF to_regclass('public.journal_days') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.journal_days ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "Users can manage own journal days" ON public.journal_days;
    EXECUTE 'CREATE POLICY "Users can manage own journal days" ON public.journal_days FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;

  IF to_regclass('public.debt_payments') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "Users can manage own debt payments" ON public.debt_payments;
    EXECUTE 'CREATE POLICY "Users can manage own debt payments" ON public.debt_payments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;
