
-- Create storage bucket for menu images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'Menu Images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow public access to the menu-images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Public Access to Menu Images'
  ) THEN
    CREATE POLICY "Public Access to Menu Images" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'menu-images');
  END IF;
END $$;

-- Create policy for authenticated users to upload to menu-images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Authenticated users can upload menu images'
  ) THEN
    CREATE POLICY "Authenticated users can upload menu images" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
      bucket_id = 'menu-images' 
      AND auth.role() = 'authenticated'
    );
  END IF;
END $$;

-- Enable update_at trigger on orders table
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column to orders if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create trigger for orders table to update the updated_at column
DROP TRIGGER IF EXISTS set_updated_at ON public.orders;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Additional indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_status ON public.menu_items(status);

-- Enable RLS on all tables
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'menu_categories' 
    AND schemaname = 'public'
    AND policyname = 'Allow public read access for menu_categories'
  ) THEN
    CREATE POLICY "Allow public read access for menu_categories" 
    ON public.menu_categories FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'menu_items' 
    AND schemaname = 'public'
    AND policyname = 'Allow public read access for menu_items'
  ) THEN
    CREATE POLICY "Allow public read access for menu_items" 
    ON public.menu_items FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'orders' 
    AND schemaname = 'public'
    AND policyname = 'Allow public read access for orders'
  ) THEN
    CREATE POLICY "Allow public read access for orders" 
    ON public.orders FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'orders' 
    AND schemaname = 'public'
    AND policyname = 'Allow public insert access for orders'
  ) THEN
    CREATE POLICY "Allow public insert access for orders" 
    ON public.orders FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'order_items' 
    AND schemaname = 'public'
    AND policyname = 'Allow public read access for order_items'
  ) THEN
    CREATE POLICY "Allow public read access for order_items" 
    ON public.order_items FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'order_items' 
    AND schemaname = 'public'
    AND policyname = 'Allow public insert access for order_items'
  ) THEN
    CREATE POLICY "Allow public insert access for order_items" 
    ON public.order_items FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Enable realtime functionality for specific tables
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    -- Check if tables are already in the publication
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'orders'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'menu_items'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'menu_categories'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_categories;
    END IF;
  END IF;
END $$;

-- Set REPLICA IDENTITY to FULL for realtime updates
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;
ALTER TABLE public.menu_categories REPLICA IDENTITY FULL;
