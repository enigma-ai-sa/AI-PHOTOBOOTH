-- AI Photobooth Storage Buckets Setup
-- Run this SQL in your Supabase SQL Editor AFTER running schema.sql

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('event-logos', 'event-logos', TRUE, 5242880, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']),
    ('event-assets', 'event-assets', TRUE, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp']),
    ('generated-images', 'generated-images', TRUE, 20971520, ARRAY['image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Storage policies for event-logos bucket
CREATE POLICY "Public read access for logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'event-logos');

CREATE POLICY "Admins can upload logos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'event-logos' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update logos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'event-logos' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete logos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'event-logos' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Storage policies for event-assets bucket (reference images, preview images)
CREATE POLICY "Public read access for assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'event-assets');

CREATE POLICY "Admins can upload assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'event-assets' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update assets" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'event-assets' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'event-assets' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Storage policies for generated-images bucket
-- Folder structure: generated-images/{event_slug}/{date}/{filename}
CREATE POLICY "Public read access for generated images" ON storage.objects
    FOR SELECT USING (bucket_id = 'generated-images');

CREATE POLICY "Anyone can upload generated images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'generated-images');
