-- Secure agent tables that were created outside the initial migrations.
-- Policies are restricted to authenticated users and owner rows only.
DO $$
BEGIN
  IF to_regclass('public.agent_tasks') IS NOT NULL THEN
    ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can perform all actions on their own agent tasks" ON public.agent_tasks;
    CREATE POLICY "Users can perform all actions on their own agent tasks"
      ON public.agent_tasks
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF to_regclass('public.agent_debates') IS NOT NULL THEN
    ALTER TABLE public.agent_debates ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can perform all actions on their own agent debates" ON public.agent_debates;
    CREATE POLICY "Users can perform all actions on their own agent debates"
      ON public.agent_debates
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF to_regclass('public.agent_debate_messages') IS NOT NULL THEN
    ALTER TABLE public.agent_debate_messages ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view debate messages of their own debates" ON public.agent_debate_messages;
    DROP POLICY IF EXISTS "Users can manage debate messages of their own debates" ON public.agent_debate_messages;
    CREATE POLICY "Users can manage debate messages of their own debates"
      ON public.agent_debate_messages
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.agent_debates d
          WHERE d.id = agent_debate_messages.debate_id
            AND d.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.agent_debates d
          WHERE d.id = agent_debate_messages.debate_id
            AND d.user_id = auth.uid()
        )
      );
  END IF;

  IF to_regclass('public.agents') IS NOT NULL THEN
    ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can perform all actions on their own agents" ON public.agents;
    CREATE POLICY "Users can perform all actions on their own agents"
      ON public.agents
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
