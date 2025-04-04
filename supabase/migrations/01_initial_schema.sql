
-- Initial schema for Qimbo Kiosk database
-- This will be automatically executed when the database container starts

-- Create schema
CREATE SCHEMA IF NOT EXISTS public;

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-super-secret-jwt-token-with-at-least-32-characters-long';

-- Create tables
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category_id INTEGER REFERENCES public.menu_categories(id),
    active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    table_number INTEGER,
    customer_name TEXT,
    status TEXT DEFAULT 'pending',
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id),
    menu_item_id INTEGER REFERENCES public.menu_items(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample data
INSERT INTO public.menu_categories (name, description, sort_order)
VALUES 
('Burgers', 'Delicious handcrafted burgers', 1),
('Sides', 'Perfect accompaniments to your meal', 2),
('Drinks', 'Refreshing beverages', 3);

INSERT INTO public.menu_items (name, description, price, category_id, sort_order)
VALUES 
('Classic Burger', 'Beef patty, lettuce, tomato, cheese', 9.99, 1, 1),
('Veggie Burger', 'Plant-based patty with fresh vegetables', 8.99, 1, 2),
('French Fries', 'Crispy golden fries', 3.99, 2, 1),
('Onion Rings', 'Battered and fried onion rings', 4.99, 2, 2),
('Soda', 'Your choice of carbonated beverage', 1.99, 3, 1),
('Milkshake', 'Creamy and delicious', 4.99, 3, 2);

-- Create RLS policies
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

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
