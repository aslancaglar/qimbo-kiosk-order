
-- Complete database schema for Qimbo Kiosk
-- Run this script when setting up a new Supabase project

-- Create schema
CREATE SCHEMA IF NOT EXISTS public;

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-super-secret-jwt-token-with-at-least-32-characters-long';

-- Restaurant Information
CREATE TABLE IF NOT EXISTS public.restaurant_info (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appearance Settings
CREATE TABLE IF NOT EXISTS public.appearance_settings (
  id SERIAL PRIMARY KEY,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Hours
CREATE TABLE IF NOT EXISTS public.business_hours (
  id SERIAL PRIMARY KEY,
  day_of_week TEXT NOT NULL,
  open_time TEXT NOT NULL,
  close_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Categories
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  category TEXT NOT NULL,
  category_id INTEGER REFERENCES public.menu_categories(id),
  status TEXT DEFAULT 'Active',
  has_toppings BOOLEAN DEFAULT FALSE,
  available_topping_categories INTEGER[] DEFAULT NULL
);

-- Topping Categories
CREATE TABLE IF NOT EXISTS public.topping_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT FALSE,
  min_selection INTEGER DEFAULT 0,
  max_selection INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);

-- Toppings
CREATE TABLE IF NOT EXISTS public.toppings (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  category_id INTEGER REFERENCES public.topping_categories(id),
  price DECIMAL(10, 2) NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  max_quantity INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id SERIAL PRIMARY KEY,
  customer_type TEXT NOT NULL,
  table_number INTEGER,
  total_amount DECIMAL(10, 2) NOT NULL,
  items_count INTEGER NOT NULL,
  status TEXT DEFAULT 'New',
  print_status TEXT,
  order_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES public.orders(id),
  menu_item_id INTEGER REFERENCES public.menu_items(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT
);

-- Order Item Toppings
CREATE TABLE IF NOT EXISTS public.order_item_toppings (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER REFERENCES public.order_items(id),
  topping_id INTEGER REFERENCES public.toppings(id),
  price DECIMAL(10, 2) NOT NULL
);

-- Print Jobs
CREATE TABLE IF NOT EXISTS public.print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT,
  job_id TEXT NOT NULL,
  printer_id TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topping_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read menu categories and items
CREATE POLICY "Allow public read access for menu_categories" ON public.menu_categories
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access for menu_items" ON public.menu_items
    FOR SELECT USING (true);

-- Everyone can read and create orders
CREATE POLICY "Allow public read access for orders" ON public.orders
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access for orders" ON public.orders
    FOR INSERT WITH CHECK (true);

-- Everyone can read and create order items
CREATE POLICY "Allow public read access for order_items" ON public.order_items
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access for order_items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- Everyone can read and create order item toppings
CREATE POLICY "Allow public read access for order_item_toppings" ON public.order_item_toppings
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access for order_item_toppings" ON public.order_item_toppings
    FOR INSERT WITH CHECK (true);

-- Everyone can read toppings and topping categories
CREATE POLICY "Allow public read access for toppings" ON public.toppings
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access for topping_categories" ON public.topping_categories
    FOR SELECT USING (true);

-- Everyone can read restaurant info
CREATE POLICY "Allow public read access for restaurant_info" ON public.restaurant_info
    FOR SELECT USING (true);

-- Everyone can read appearance settings
CREATE POLICY "Allow public read access for appearance_settings" ON public.appearance_settings
    FOR SELECT USING (true);

-- Everyone can read business hours
CREATE POLICY "Allow public read access for business_hours" ON public.business_hours
    FOR SELECT USING (true);

-- Everyone can read settings
CREATE POLICY "Allow public read access for settings" ON public.settings
    FOR SELECT USING (true);

-- Create necessary storage buckets
-- Note: You'll need to create the storage bucket 'menu-images' manually in the Supabase dashboard
-- or use the Supabase client API to create it

-- Insert initial data (optional - add sample data as needed)
-- Example:
-- INSERT INTO public.restaurant_info (name, description) VALUES ('My Restaurant', 'Delicious food');

-- Create necessary functions, triggers, etc. (if applicable)
