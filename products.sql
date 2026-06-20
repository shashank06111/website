-- ============================================================
-- products.sql
-- Schema + seed data for the Vantra product catalogue.
-- Loaded automatically by server-example.js on startup (SQLite).
-- The same statements work on MySQL/Postgres with trivial tweaks
-- (see notes at the bottom).
-- ============================================================

DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id        TEXT PRIMARY KEY,   -- e.g. 'mob-01a' — one row per variant
  name      TEXT NOT NULL,      -- base product name, e.g. 'Lumen X12 5G'
  category  TEXT NOT NULL,      -- 'Mobiles' | 'Laptops' | 'TV & Audio' | 'Appliances'
  variant   TEXT NOT NULL,      -- e.g. '256GB · Ocean Blue'
  spec      TEXT NOT NULL,      -- short spec line
  price     INTEGER NOT NULL,   -- rupees (converted to paise at checkout)
  icon      TEXT NOT NULL,      -- emoji used as a placeholder thumbnail
  stock     INTEGER NOT NULL DEFAULT 0
);

-- Helpful for the LIKE-based search the /api/search endpoint runs.
CREATE INDEX idx_products_name     ON products(name);
CREATE INDEX idx_products_category ON products(category);

INSERT INTO products (id, name, category, variant, spec, price, icon, stock) VALUES
  ('mob-01a', 'Lumen X12 5G',          'Mobiles',     '128GB · Graphite',          '5000mAh · 5G',       24999, '📱', 12),
  ('mob-01b', 'Lumen X12 5G',          'Mobiles',     '256GB · Ocean Blue',        '5000mAh · 5G',       27999, '📱', 8),
  ('mob-02a', 'Aria Lite 5G',          'Mobiles',     '64GB · Black',              '4500mAh · 5G',       14499, '📱', 20),
  ('mob-02b', 'Aria Lite 5G',          'Mobiles',     '128GB · Silver',            '4500mAh · 5G',       16499, '📱', 15),
  ('lap-01a', 'Forge 14 Ultrabook',    'Laptops',     '16GB / 512GB · Space Grey', 'Intel i5',            54990, '💻', 10),
  ('lap-01b', 'Forge 14 Ultrabook',    'Laptops',     '16GB / 1TB · Silver',       'Intel i5',            59990, '💻', 6),
  ('lap-02',  'Workbench Pro 16',      'Laptops',     '32GB / 1TB · Black',        'Intel i7',            89990, '💻', 5),
  ('tv-01a',  'Vantra 55" 4K Smart TV','TV & Audio',  '55-inch',                   '4K HDR · WebOS',      42990, '📺', 7),
  ('tv-01b',  'Vantra 65" 4K Smart TV','TV & Audio',  '65-inch',                   '4K HDR · WebOS',      58990, '📺', 4),
  ('tv-02',   'Pulse Soundbar 2.1',    'TV & Audio',  '2.1 Channel · Black',       '120W · Bluetooth',    6499,  '🔊', 18),
  ('app-01a', 'ChillCore Fridge',      'Appliances',  '260L · Silver',             'Frost-free · 3 Star', 28990, '🧊', 9),
  ('app-01b', 'ChillCore Fridge',      'Appliances',  '340L · Black Steel',        'Frost-free · 4 Star', 34990, '🧊', 5),
  ('app-02',  'SpinWash Washer',       'Appliances',  '7kg · White',               'Front-load · Inverter', 19990, '🌀', 11),
  ('app-03a', 'AeroCool Tower Fan',    'Appliances',  'Standard · White',          'Remote · 3 Speeds',   3499,  '🌬', 25),
  ('app-03b', 'AeroCool Tower Fan',    'Appliances',  'Smart Wi-Fi · Black',       'App Control',         4999,  '🌬', 14);

-- ------------------------------------------------------------
-- Example search query (this is what /api/search runs, with the
-- search term bound as a parameter — never string-concatenated,
-- to avoid SQL injection):
--
--   SELECT id, name, category, variant, spec, price, icon
--   FROM products
--   WHERE name LIKE ? OR category LIKE ? OR variant LIKE ? OR spec LIKE ?
--   ORDER BY name
--   LIMIT 20;
--
-- with each ? bound to '%' || :term || '%'.
-- ------------------------------------------------------------

-- Notes for MySQL/Postgres:
--   * MySQL:    swap TEXT PRIMARY KEY -> VARCHAR(20) PRIMARY KEY,
--               and AUTOINCREMENT isn't needed since ids are explicit.
--   * Postgres: same column types work as-is; CREATE INDEX syntax is identical.
