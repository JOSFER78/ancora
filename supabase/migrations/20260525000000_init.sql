-- 1. Create profiles table linked to Auth users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('emilio', 'supervisor')),
    bingx_api_key TEXT,
    bingx_api_secret TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create debts table
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    creditor TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    priority INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create daily_moods (Diario de Sensaciones) table
CREATE TABLE IF NOT EXISTS public.daily_moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT current_date,
    anxiety_level INTEGER NOT NULL CHECK (anxiety_level BETWEEN 1 AND 10),
    impulsivity_level INTEGER NOT NULL CHECK (impulsivity_level BETWEEN 1 AND 10),
    atomoxetina_taken BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    trading_today BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- 4. Create legal_roadmap table
CREATE TABLE IF NOT EXISTS public.legal_roadmap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phase_number INTEGER NOT NULL CHECK (phase_number BETWEEN 1 AND 5),
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_phase UNIQUE (user_id, phase_number)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_roadmap ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies for Profiles
CREATE POLICY "Allow users to read their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Allow supervisors to read all profiles" 
    ON public.profiles FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'));

CREATE POLICY "Allow users to update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 6. Define RLS Policies for Debts
CREATE POLICY "Allow users to select their own debts" 
    ON public.debts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow supervisors to select debts" 
    ON public.debts FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'));

CREATE POLICY "Allow users to insert/update/delete their own debts" 
    ON public.debts FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. Define RLS Policies for Daily Moods
CREATE POLICY "Allow users to select their own moods" 
    ON public.daily_moods FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow supervisors to select moods" 
    ON public.daily_moods FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'));

CREATE POLICY "Allow users to insert/update/delete their own moods" 
    ON public.daily_moods FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. Define RLS Policies for Legal Roadmap
CREATE POLICY "Allow users to select their own roadmap" 
    ON public.legal_roadmap FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow supervisors to select roadmaps" 
    ON public.legal_roadmap FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'));

CREATE POLICY "Allow users to insert/update/delete their own roadmaps" 
    ON public.legal_roadmap FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
