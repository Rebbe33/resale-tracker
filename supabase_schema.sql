-- =============================================
-- RESALE TRACKER — Schéma Supabase (préfixe rv_)
-- À coller dans Supabase > SQL Editor > New query
-- =============================================

CREATE TABLE rv_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  acquisition_type TEXT NOT NULL DEFAULT 'achat',
  acquisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
  purchase_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  condition TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'en_stock',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rv_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES rv_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rv_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES rv_items(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  listed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  initial_price NUMERIC(10,2) NOT NULL,
  current_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'actif',
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rv_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES rv_listings(id) ON DELETE CASCADE,
  old_price NUMERIC(10,2) NOT NULL,
  new_price NUMERIC(10,2) NOT NULL,
  changed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rv_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES rv_items(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES rv_listings(id),
  platform TEXT NOT NULL,
  sold_at DATE NOT NULL DEFAULT CURRENT_DATE,
  sold_price NUMERIC(10,2) NOT NULL,
  platform_fees NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_paid_by_buyer BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE VIEW rv_item_summary AS
SELECT
  i.id,
  i.name,
  i.category,
  i.status,
  i.acquisition_type,
  i.acquisition_date,
  i.purchase_price,
  i.condition,
  COALESCE(SUM(c.amount), 0) AS total_costs,
  s.sold_price,
  s.platform_fees,
  s.platform AS sold_platform,
  s.sold_at,
  CASE WHEN s.sold_price IS NOT NULL THEN
    s.sold_price - COALESCE(s.platform_fees, 0) - i.purchase_price - COALESCE(SUM(c.amount), 0)
  ELSE NULL END AS net_profit
FROM rv_items i
LEFT JOIN rv_costs c ON c.item_id = i.id
LEFT JOIN rv_sales s ON s.item_id = i.id
GROUP BY i.id, i.name, i.category, i.status, i.acquisition_type, i.acquisition_date,
         i.purchase_price, i.condition, s.sold_price, s.platform_fees, s.platform, s.sold_at;
