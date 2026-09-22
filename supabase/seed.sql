-- ComUnite Seed Script
-- File: supabase/seed.sql

-- 1. Collection Points
INSERT INTO collection_points (id, name, address, capacity_units, latitude, longitude, is_active)
VALUES
  ('c0000000-0000-4000-8000-000000000001', 'Chilenje Community Hub', 'Chilenje Market, Plot 42, Lusaka', 1000, -15.4385, 28.3245, true),
  ('c0000000-0000-4000-8000-000000000002', 'Matero Depot Node', 'Matero Market Point, Plot 108, Lusaka', 1500, -15.3892, 28.2611, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Base Products & Raw Commodities
INSERT INTO products (id, name, description, category, price_per_unit, retail_price_ref, unit_name, is_raw_material, is_active)
VALUES
  ('p0000000-0000-4000-8000-000000000001', 'Mealie Meal 25kg (Breakfast)', 'National Milling / Eagle brand staple mealie meal.', 'Grains & Flour', 180.00, 380.00, '25kg bag', false, true),
  ('p0000000-0000-4000-8000-000000000002', 'Raw Yellow Maize Grain', 'Cleaned grade-A raw maize grain for milling.', 'Agricultural Commodities', 110.00, 210.00, 'Metric Ton equivalent', true, true),
  ('p0000000-0000-4000-8000-000000000003', 'Refined Cooking Oil 20L', 'Pure vegetable cooking oil in bulk containers.', 'Cooking & Oils', 240.00, 340.00, '20L container', false, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Transformation Specs (Raw Material Yield Ratios)
INSERT INTO transformation_specs (id, input_raw_product_id, output_product_id, conversion_ratio, processing_cost_per_unit, yield_description, is_active)
VALUES
  ('t0000000-0000-4000-8000-000000000001', 'p0000000-0000-4000-8000-000000000002', 'p0000000-0000-4000-8000-000000000001', 1.4000, 35.00, '1.4kg raw maize yields 1kg breakfast mealie meal + 0.35kg bran byproduct.', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Sample Model B Hybrid Demand Group
INSERT INTO purchase_groups (
  id, product_id, collection_point_id, created_by_user_id, title, target_quantity, committed_quantity, funded_quantity, unit_price, collection_point, closes_at, status, fulfillment_mode
) VALUES (
  'g0000000-0000-4000-8000-000000000001',
  'p0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Mealie Meal Group · Chilenje Depot',
  100, 68, 68, 180.00, 'Chilenje Community Hub',
  now() + interval '5 days', 'OPEN', 'MODEL_B_VALUE_CHAIN'
) ON CONFLICT (id) DO NOTHING;
