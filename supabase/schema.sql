-- AI Photobooth Multi-Tenant Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operations')),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    company_name TEXT NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ
);

-- Theme configuration per event
CREATE TABLE public.event_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    primary_color TEXT NOT NULL DEFAULT '#007B3A',
    secondary_color TEXT NOT NULL DEFAULT '#004d25',
    accent_color TEXT DEFAULT '#00a651',
    background_gradient_start TEXT DEFAULT '#007B3A',
    background_gradient_end TEXT DEFAULT '#004d25',
    font_family TEXT DEFAULT 'Alexandria',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id)
);

-- Prompts/Styles per event
CREATE TABLE public.event_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    option_key TEXT NOT NULL,
    title TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    reference_image_url TEXT,
    preview_image_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, option_key)
);

-- Generated images (for cost tracking)
CREATE TABLE public.generated_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES public.event_prompts(id),
    original_image_url TEXT,
    generated_image_url TEXT NOT NULL,
    qr_code_url TEXT,
    model_used TEXT NOT NULL,
    tokens_used INT,
    estimated_cost DECIMAL(10, 6),
    processing_time_ms INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event sessions (for analytics)
CREATE TABLE public.event_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    started_by UUID REFERENCES public.profiles(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    images_generated INT DEFAULT 0,
    total_cost DECIMAL(10, 4) DEFAULT 0
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_is_active ON public.events(is_active);
CREATE INDEX idx_event_prompts_event_id ON public.event_prompts(event_id);
CREATE INDEX idx_generated_images_event_id ON public.generated_images(event_id);
CREATE INDEX idx_generated_images_created_at ON public.generated_images(created_at);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Anyone can view active events" ON public.events
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Authenticated users can view all events" ON public.events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage events" ON public.events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Event themes policies
CREATE POLICY "Anyone can view themes for active events" ON public.event_themes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_themes.event_id AND events.is_active = TRUE
        )
    );

CREATE POLICY "Authenticated can view all themes" ON public.event_themes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage themes" ON public.event_themes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Event prompts policies
CREATE POLICY "Anyone can view prompts for active events" ON public.event_prompts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_prompts.event_id AND events.is_active = TRUE
        )
    );

CREATE POLICY "Authenticated can view all prompts" ON public.event_prompts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage prompts" ON public.event_prompts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Generated images policies
CREATE POLICY "Authenticated users can view images" ON public.generated_images
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert images" ON public.generated_images
    FOR INSERT WITH CHECK (TRUE);

-- Event sessions policies
CREATE POLICY "Authenticated users can manage sessions" ON public.event_sessions
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_themes_updated_at
    BEFORE UPDATE ON public.event_themes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_prompts_updated_at
    BEFORE UPDATE ON public.event_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'operations'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create default theme when event is created
CREATE OR REPLACE FUNCTION public.create_default_theme()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.event_themes (event_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_event_created
    AFTER INSERT ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.create_default_theme();
