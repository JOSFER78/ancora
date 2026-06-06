-- =======================================================
-- MIGRACIÓN: MOTOR CLÍNICO CENTRAL DE ÁNCORA
-- =======================================================
-- Este script crea las tablas relacionales para el timeline,
-- medicaciones y propuestas de la IA (Walter IA) con RLS.

-- 1. Tabla de Timeline Clínico (Eventos)
CREATE TABLE IF NOT EXISTS public.timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('vital_event', 'symptom_start', 'medication_change', 'crisis', 'therapy_session', 'document_upload', 'other')),
    description TEXT NOT NULL,
    associated_emotion TEXT,
    intensity INTEGER CHECK (intensity BETWEEN 1 AND 10),
    authority_level INTEGER NOT NULL DEFAULT 3 CHECK (authority_level BETWEEN 1 AND 4), -- 1: Validado, 2: Documentado, 3: Declarado, 4: Inferencia IA
    validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    source_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Medicaciones del Paciente
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dose TEXT NOT NULL,
    frequency TEXT NOT NULL,
    prescriber TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'historical')),
    authority_level INTEGER NOT NULL DEFAULT 3 CHECK (authority_level BETWEEN 1 AND 4), -- 1: Validado, 2: Documentado, 3: Declarado, 4: Inferencia IA
    validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    source_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Propuestas Pendientes de la IA (Walter IA)
CREATE TABLE IF NOT EXISTS public.pending_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    proposal_type TEXT NOT NULL CHECK (proposal_type IN ('medication', 'timeline_event', 'psychological_history', 'risk_event', 'other')),
    source_type TEXT NOT NULL, -- ej: 'document', 'chat_message', 'diary_checkin'
    source_metadata JSONB DEFAULT '{}'::jsonb, -- ej: { "fileName": "analisis.pdf", "extractedText": "..." }
    proposal_data JSONB NOT NULL, -- Datos a insertar/actualizar (name, dose, date, description, etc.)
    confidence NUMERIC(4, 2) NOT NULL DEFAULT 0.50, -- Confianza del modelo (0.0 a 1.0)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_proposals ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para Timeline Clínico
CREATE POLICY "Users can view their own timeline" 
    ON public.timeline_events FOR SELECT 
    USING (auth.uid() = patient_id);

CREATE POLICY "Supervisors can view all timelines" 
    ON public.timeline_events FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'));

CREATE POLICY "Supervisors can manage timeline events" 
    ON public.timeline_events FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'));

CREATE POLICY "Users can manage their own timeline if declared" 
    ON public.timeline_events FOR INSERT 
    WITH CHECK (auth.uid() = patient_id AND authority_level = 3);

-- 5. Políticas RLS para Medicaciones
CREATE POLICY "Users can view their own medications" 
    ON public.medications FOR SELECT 
    USING (auth.uid() = patient_id);

CREATE POLICY "Supervisors can view all medications" 
    ON public.medications FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'));

CREATE POLICY "Supervisors can manage medications" 
    ON public.medications FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'));

CREATE POLICY "Users can manage their own medications if declared" 
    ON public.medications FOR INSERT 
    WITH CHECK (auth.uid() = patient_id AND authority_level = 3);

-- 6. Políticas RLS para Propuestas Pendientes (Walter IA)
-- Solo supervisores y administradores deberían gestionar propuestas, pero el paciente podría disparar la creación mediante su upload.
CREATE POLICY "Supervisors can manage pending proposals" 
    ON public.pending_proposals FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'));

CREATE POLICY "Users can view their own pending proposals"
    ON public.pending_proposals FOR SELECT
    USING (auth.uid() = patient_id);

CREATE POLICY "Users can insert proposals via ingestion pipeline"
    ON public.pending_proposals FOR INSERT
    WITH CHECK (auth.uid() = patient_id);
