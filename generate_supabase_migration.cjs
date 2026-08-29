const fs = require('fs');
const path = require('path');

const categories = require('./src/data/categories.json');
const products = require('./src/data/products.json');
const reviews = require('./src/data/reviews.json');
const offers = require('./src/data/offers.json');
const banners = require('./src/data/banners.json');

function sqlEscape(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'number' || typeof str === 'boolean') return str;
  return `'` + String(str).replace(/'/g, `''`) + `'`;
}

function jsonEscape(obj) {
  if (!obj) return `'[]'::jsonb`;
  return `'` + JSON.stringify(obj).replace(/'/g, `''`) + `'::jsonb`;
}

function arrayEscape(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return `'{}'::text[]`;
  const escapedItems = arr.map(item => `"` + String(item).replace(/"/g, `\\"`) + `"`);
  return `'{` + escapedItems.join(',') + `}'::text[]`;
}

let sql = `-- ==============================================================================
-- LYDIA GLOBAL EXIM - SUPABASE COMPLETE DATABASE SCHEMA & DATA MIGRATION SCRIPT
-- ==============================================================================
-- Run this entire script in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running migration
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Create Categories Table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  models JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Products Table (90 Products with full specs, variants & INR pricing)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  images TEXT[],
  variants JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  model TEXT,
  sku TEXT,
  specifications JSONB DEFAULT '{}'::jsonb,
  rating NUMERIC DEFAULT 4.8,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Offers & Coupons Table
CREATE TABLE offers (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  discount_percentage NUMERIC NOT NULL,
  min_order_value NUMERIC DEFAULT 0,
  min_qty INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Banners Table
CREATE TABLE banners (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT DEFAULT '/category/all',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create User Profiles Table (Linked with Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  mobile TEXT,
  role TEXT DEFAULT 'customer',
  addresses JSONB DEFAULT '[]'::jsonb,
  wishlist INTEGER[] DEFAULT '{}'::integer[],
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create Orders Table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL,
  shipping_address JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  shipping NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'online',
  payment_status TEXT DEFAULT 'paid',
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create Customer Reviews Table
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  location TEXT,
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Enable Row Level Security (RLS) on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 11. Create Security Policies (Public read for catalog, secure writes for users)
CREATE POLICY "Public categories read" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin categories all" ON categories FOR ALL USING (auth.jwt()->>'role' = 'service_role' OR auth.jwt()->>'email' IN ('gouravboga12@gmail.com', 'lydiaglobalexim@gmail.com'));

CREATE POLICY "Public products read" ON products FOR SELECT USING (true);
CREATE POLICY "Admin products all" ON products FOR ALL USING (auth.jwt()->>'role' = 'service_role' OR auth.jwt()->>'email' IN ('gouravboga12@gmail.com', 'lydiaglobalexim@gmail.com'));

CREATE POLICY "Public offers read" ON offers FOR SELECT USING (true);
CREATE POLICY "Public banners read" ON banners FOR SELECT USING (true);
CREATE POLICY "Public reviews read" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated reviews insert" ON reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Users insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view/update own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- 12. Create Automatic Profile Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    CASE WHEN new.email IN ('gouravboga12@gmail.com', 'lydiaglobalexim@gmail.com') THEN 'admin' ELSE 'customer' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- INSERT CATEGORIES (9 Categories)
-- ==============================================================================
`;

categories.forEach(cat => {
  sql += `INSERT INTO categories (id, name, image_url, models) VALUES (${cat.id}, ${sqlEscape(cat.name)}, ${sqlEscape(cat.image_url)}, ${jsonEscape(cat.models)}) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, image_url=EXCLUDED.image_url, models=EXCLUDED.models;\n`;
});

sql += `SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));\n\n`;

sql += `-- ==============================================================================
-- INSERT OFFERS & COUPONS
-- ==============================================================================
`;

offers.forEach(o => {
  sql += `INSERT INTO offers (id, code, title, discount_percentage, min_order_value, min_qty, active) VALUES (${o.id}, ${sqlEscape(o.code)}, ${sqlEscape(o.title)}, ${o.discount_percentage}, ${o.min_order_value || 0}, ${o.min_qty || 1}, ${o.active ?? true}) ON CONFLICT (code) DO NOTHING;\n`;
});

sql += `SELECT setval('offers_id_seq', (SELECT MAX(id) FROM offers));\n\n`;

sql += `-- ==============================================================================
-- INSERT BANNERS
-- ==============================================================================
`;

banners.forEach(b => {
  sql += `INSERT INTO banners (id, title, subtitle, image_url, link_url, active) VALUES (${b.id}, ${sqlEscape(b.title)}, ${sqlEscape(b.subtitle)}, ${sqlEscape(b.image_url)}, ${sqlEscape(b.link_url)}, true) ON CONFLICT (id) DO NOTHING;\n`;
});

sql += `SELECT setval('banners_id_seq', (SELECT MAX(id) FROM banners));\n\n`;

sql += `-- ==============================================================================
-- INSERT PRODUCTS (90 Imitation Jewelry Products with Specs & INR Pricing)
-- ==============================================================================
`;

products.forEach(p => {
  const images = p.images && p.images.length > 0 ? p.images : [p.image_url];
  sql += `INSERT INTO products (id, name, category, description, image_url, images, variants, sizes, model, sku, specifications, rating) VALUES (${p.id}, ${sqlEscape(p.name)}, ${sqlEscape(p.category)}, ${sqlEscape(p.description)}, ${sqlEscape(p.image_url)}, ${arrayEscape(images)}, ${jsonEscape(p.variants)}, ${jsonEscape(p.sizes)}, ${sqlEscape(p.model)}, ${sqlEscape(p.sku || p.product_code)}, ${jsonEscape(p.specifications)}, ${p.rating || 4.8}) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description, image_url=EXCLUDED.image_url, images=EXCLUDED.images, variants=EXCLUDED.variants, sizes=EXCLUDED.sizes, specifications=EXCLUDED.specifications;\n`;
});

sql += `SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));\n\n`;

sql += `-- ==============================================================================
-- INSERT REVIEWS
-- ==============================================================================
`;

reviews.forEach((r, idx) => {
  const prodId = r.product_id || (idx % 90) + 1;
  sql += `INSERT INTO reviews (product_id, user_name, rating, comment, location, verified) VALUES (${prodId}, ${sqlEscape(r.user_name || r.name)}, ${r.rating || 5}, ${sqlEscape(r.comment || r.review)}, ${sqlEscape(r.location || 'India')}, true);\n`;
});

sql += `\n-- MIGRATION COMPLETE! ALL 90 PRODUCTS, 9 CATEGORIES, OFFERS, AND BANNERS ARE LOADED.\n`;

fs.writeFileSync('./supabase_schema_and_data.sql', sql);
console.log('Successfully generated supabase_schema_and_data.sql (Size: ' + (sql.length / 1024).toFixed(1) + ' KB)');
