-- Security Script for Supabase Settings Table
-- Purpose: Restrict updates to the 'aiConfig' to only the admin user.

-- 1. Enable RLS on the 'settings' table (if not already enabled)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 2. Allow anyone to SELECT (read) the config (needed for the site to work for everyone)
CREATE POLICY "Allow public read access to settings" 
ON public.settings FOR SELECT 
USING (true);

-- 3. Restrict INSERT/UPDATE/DELETE to the admin user only ('davizeravisel@gmail.com')
CREATE POLICY "Allow admin to update aiConfig" 
ON public.settings FOR ALL 
USING (auth.jwt() ->> 'email' = 'davizeravisel@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'davizeravisel@gmail.com');
