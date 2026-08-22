/*
# Seed OorFix reference data

1. Inserts
- 4 departments: Electricity, Water, Sanitation, Roads.
- 8 categories: street_light, road, drainage, garbage, water_supply, encroachment, public_safety, other.
  Each mapped to a default department with icon and color.
*/

INSERT INTO departments (name, contact_phone, sla_hours_by_category)
SELECT * FROM (VALUES
  ('Electricity', '044-1001', '{"street_light": 24, "public_safety": 12}'::jsonb),
  ('Water', '044-1002', '{"water_supply": 48}'::jsonb),
  ('Sanitation', '044-1003', '{"garbage": 24, "drainage": 72}'::jsonb),
  ('Roads', '044-1004', '{"road": 96, "encroachment": 120}'::jsonb)
) AS d(name, contact_phone, sla_hours_by_category)
WHERE NOT EXISTS (SELECT 1 FROM departments);

INSERT INTO categories (name, slug, default_department_id, icon_name, color_hex)
SELECT c.name, c.slug, dep.id, c.icon_name, c.color_hex
FROM (VALUES
  ('Street Light', 'street_light', 'Electricity', 'Lightbulb', '#f59e0b'),
  ('Road', 'road', 'Roads', 'Construction', '#78350f'),
  ('Drainage', 'drainage', 'Sanitation', 'Waves', '#0891b2'),
  ('Garbage', 'garbage', 'Sanitation', 'Trash2', '#16a34a'),
  ('Water Supply', 'water_supply', 'Water', 'Droplets', '#2563eb'),
  ('Encroachment', 'encroachment', 'Roads', 'Ban', '#dc2626'),
  ('Public Safety', 'public_safety', 'Electricity', 'ShieldAlert', '#7c3aed'),
  ('Other', 'other', 'Roads', 'AlertCircle', '#64748b')
) AS c(name, slug, dept_name, icon_name, color_hex)
JOIN departments dep ON dep.name = c.dept_name
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = c.slug);
