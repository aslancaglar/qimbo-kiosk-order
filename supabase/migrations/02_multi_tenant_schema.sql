
-- Schema updates for multi-tenant support
-- Will only be executed if it hasn't been run before

-- Add restaurant_id column to existing tables for multi-tenancy
ALTER TABLE IF EXISTS public.menu_categories
ADD COLUMN IF NOT EXISTS restaurant_id TEXT;

ALTER TABLE IF EXISTS public.menu_items
ADD COLUMN IF NOT EXISTS restaurant_id TEXT;

ALTER TABLE IF EXISTS public.orders
ADD COLUMN IF NOT EXISTS restaurant_id TEXT;

ALTER TABLE IF EXISTS public.order_items
ADD COLUMN IF NOT EXISTS restaurant_id TEXT;

-- Create restaurant_info table
CREATE TABLE IF NOT EXISTS public.restaurant_info (
    id SERIAL PRIMARY KEY,
    restaurant_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    email TEXT,
    currency TEXT DEFAULT '€',
    tax_rate DECIMAL(5, 2) DEFAULT 0.10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table for restaurant-specific settings
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    restaurant_id TEXT,
    key TEXT NOT NULL,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, key)
);

-- Update RLS policies for multi-tenancy
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow public read access for menu_categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Allow public read access for menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow public read access for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert access for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read access for order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public insert access for order_items" ON public.order_items;

-- Create new tenant-aware policies
CREATE POLICY "Allow tenant-specific read access for menu_categories" ON public.menu_categories
    FOR SELECT USING (restaurant_id = current_setting('app.restaurant_id', TRUE) OR restaurant_id IS NULL);

CREATE POLICY "Allow tenant-specific read access for menu_items" ON public.menu_items
    FOR SELECT USING (restaurant_id = current_setting('app.restaurant_id', TRUE) OR restaurant_id IS NULL);

CREATE POLICY "Allow tenant-specific read access for orders" ON public.orders
    FOR SELECT USING (restaurant_id = current_setting('app.restaurant_id', TRUE) OR restaurant_id IS NULL);

CREATE POLICY "Allow tenant-specific insert access for orders" ON public.orders
    FOR INSERT WITH CHECK (restaurant_id = current_setting('app.restaurant_id', TRUE) OR restaurant_id IS NULL);

CREATE POLICY "Allow tenant-specific read access for order_items" ON public.order_items
    FOR SELECT USING (
        restaurant_id = current_setting('app.restaurant_id', TRUE) OR 
        restaurant_id IS NULL OR
        order_id IN (SELECT id FROM public.orders WHERE restaurant_id = current_setting('app.restaurant_id', TRUE))
    );

CREATE POLICY "Allow tenant-specific insert access for order_items" ON public.order_items
    FOR INSERT WITH CHECK (
        restaurant_id = current_setting('app.restaurant_id', TRUE) OR 
        restaurant_id IS NULL OR
        order_id IN (SELECT id FROM public.orders WHERE restaurant_id = current_setting('app.restaurant_id', TRUE))
    );

-- Create policies for restaurant_info and settings
ALTER TABLE public.restaurant_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow tenant-specific read access for restaurant_info" ON public.restaurant_info
    FOR SELECT USING (restaurant_id = current_setting('app.restaurant_id', TRUE) OR restaurant_id IS NULL);

CREATE POLICY "Allow tenant-specific read access for settings" ON public.settings
    FOR SELECT USING (restaurant_id = current_setting('app.restaurant_id', TRUE) OR restaurant_id IS NULL);

CREATE POLICY "Allow tenant-specific insert access for settings" ON public.settings
    FOR INSERT WITH CHECK (restaurant_id = current_setting('app.restaurant_id', TRUE) OR restaurant_id IS NULL);

CREATE POLICY "Allow tenant-specific update access for settings" ON public.settings
    FOR UPDATE USING (restaurant_id = current_setting('app.restaurant_id', TRUE) OR restaurant_id IS NULL);
