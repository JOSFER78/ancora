-- Migración: Tabla de créditos del paciente para control de tokens y tiempo Live
CREATE TABLE IF NOT EXISTS public.patient_credits (
    patient_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    text_credits_total INTEGER NOT NULL DEFAULT 450000, -- 450k tokens mensuales (~15 min diarios)
    text_credits_used INTEGER NOT NULL DEFAULT 0,
    live_credits_total INTEGER NOT NULL DEFAULT 14400,   -- 4 horas al mes en segundos (14400s)
    live_credits_used INTEGER NOT NULL DEFAULT 0,
    document_credits_total INTEGER NOT NULL DEFAULT 10,  -- 10 documentos clínicos por ciclo
    document_credits_used INTEGER NOT NULL DEFAULT 0,
    cycle_start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    cycle_end_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + INTERVAL '1 month'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.patient_credits ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
DROP POLICY IF EXISTS "Users can view their own credits" ON public.patient_credits;
CREATE POLICY "Users can view their own credits"
    ON public.patient_credits FOR SELECT TO authenticated
    USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Supervisors can view all patient credits" ON public.patient_credits;
CREATE POLICY "Supervisors can view all patient credits"
    ON public.patient_credits FOR SELECT TO authenticated
    USING (public.is_clinical_admin() OR exists (
        select 1 from public.psychologist_patient_links ppl
        where ppl.patient_id = patient_credits.patient_id
          and ppl.psychologist_id = auth.uid()
          and ppl.status = 'active'
    ));

-- Habilitar inserción/actualización para el motor de backend (service_role no requiere políticas específicas, pero para desarrollo local con bypass seguro)
DROP POLICY IF EXISTS "Service role bypass credits" ON public.patient_credits;
CREATE POLICY "Service role bypass credits"
    ON public.patient_credits FOR ALL TO authenticated
    USING (auth.uid() = patient_id OR public.is_clinical_admin())
    WITH CHECK (auth.uid() = patient_id OR public.is_clinical_admin());

-- Trigger para updated_at
DROP TRIGGER IF EXISTS touch_patient_credits_updated_at ON public.patient_credits;
CREATE TRIGGER touch_patient_credits_updated_at BEFORE UPDATE ON public.patient_credits
for each row execute function public.touch_updated_at();

-- Función trigger para crear créditos al crear un perfil
CREATE OR REPLACE FUNCTION public.handle_new_profile_credits()
RETURNS trigger AS $$
BEGIN
  -- Solo crear créditos si el perfil no es supervisor
  IF new.role != 'supervisor' THEN
    INSERT INTO public.patient_credits (patient_id)
    VALUES (new.id)
    ON CONFLICT (patient_id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sobre public.profiles
DROP TRIGGER IF EXISTS create_credits_on_profile ON public.profiles;
CREATE TRIGGER create_credits_on_profile
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_credits();

-- Poblar créditos para los perfiles ya existentes que no sean supervisores
INSERT INTO public.patient_credits (patient_id)
SELECT id FROM public.profiles
WHERE role != 'supervisor'
ON CONFLICT (patient_id) DO NOTHING;
