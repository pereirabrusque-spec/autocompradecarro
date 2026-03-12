-- Ensure the 'banners' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
SELECT 'banners', 'banners', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'banners'
);

-- Set up RLS policies for the 'banners' bucket
-- Allow public read access
DROP POLICY IF EXISTS "Public Access Banners" ON storage.objects;
CREATE POLICY "Public Access Banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');

-- Allow public upload (for the API route to work even if service_role is misconfigured)
DROP POLICY IF EXISTS "Public Upload Banners" ON storage.objects;
CREATE POLICY "Public Upload Banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners');

-- Allow public update
DROP POLICY IF EXISTS "Public Update Banners" ON storage.objects;
CREATE POLICY "Public Update Banners" ON storage.objects FOR UPDATE USING (bucket_id = 'banners');

-- Allow public delete
DROP POLICY IF EXISTS "Public Delete Banners" ON storage.objects;
CREATE POLICY "Public Delete Banners" ON storage.objects FOR DELETE USING (bucket_id = 'banners');
