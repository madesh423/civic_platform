/*
# Seed demo users, worker profiles, and sample reports

1. Demo auth users (password: demo1234)
2. Profiles with name, role, ward, language, phone
3. Worker profile with skills and base location
4. 12 sample reports across categories and statuses
*/

DO $$
DECLARE
  citizen_id uuid;
  worker_id uuid;
  admin_id uuid;
  cat_light uuid;
  cat_road uuid;
  cat_drain uuid;
  cat_garbage uuid;
  cat_water uuid;
  cat_encroach uuid;
  cat_safety uuid;
  cat_other uuid;
  dep_elec uuid;
  dep_water uuid;
  dep_sani uuid;
  dep_roads uuid;
  pwd_hash text;
BEGIN
  pwd_hash := crypt('demo1234', gen_salt('bf', 10));

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'citizen@oorfix.app') THEN
    INSERT INTO auth.users
      (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES
      ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       'citizen@oorfix.app', pwd_hash, now(), now(), now(), '{}'::jsonb, '{}'::jsonb);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'worker@oorfix.app') THEN
    INSERT INTO auth.users
      (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES
      ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       'worker@oorfix.app', pwd_hash, now(), now(), now(), '{}'::jsonb, '{}'::jsonb);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@oorfix.app') THEN
    INSERT INTO auth.users
      (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES
      ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       'admin@oorfix.app', pwd_hash, now(), now(), now(), '{}'::jsonb, '{}'::jsonb);
  END IF;

  SELECT id INTO citizen_id FROM auth.users WHERE email = 'citizen@oorfix.app';
  SELECT id INTO worker_id FROM auth.users WHERE email = 'worker@oorfix.app';
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@oorfix.app';

  INSERT INTO profiles (id, name, phone, role, language, ward)
  VALUES
    (citizen_id, 'Arun Kumar', '9876543210', 'CITIZEN', 'EN', 'Ward 6 - Teynampet'),
    (worker_id, 'Murugan S', '9876543211', 'WORKER', 'EN', 'Ward 1 - Tondiarpet'),
    (admin_id, 'Priya Admin', '9876543212', 'ADMIN', 'EN', 'Ward 9 - Adyar')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    ward = EXCLUDED.ward,
    language = EXCLUDED.language;

  INSERT INTO worker_profiles (user_id, skills, base_lat, base_lng, max_tasks_per_day, is_active)
  VALUES (worker_id, ARRAY['ELECTRICIAN','ROAD','GENERAL']::worker_skill[], 13.0827, 80.2707, 6, true)
  ON CONFLICT (user_id) DO UPDATE SET
    skills = EXCLUDED.skills,
    base_lat = EXCLUDED.base_lat,
    base_lng = EXCLUDED.base_lng,
    max_tasks_per_day = EXCLUDED.max_tasks_per_day,
    is_active = EXCLUDED.is_active;

  SELECT id INTO cat_light FROM categories WHERE slug = 'street_light';
  SELECT id INTO cat_road FROM categories WHERE slug = 'road';
  SELECT id INTO cat_drain FROM categories WHERE slug = 'drainage';
  SELECT id INTO cat_garbage FROM categories WHERE slug = 'garbage';
  SELECT id INTO cat_water FROM categories WHERE slug = 'water_supply';
  SELECT id INTO cat_encroach FROM categories WHERE slug = 'encroachment';
  SELECT id INTO cat_safety FROM categories WHERE slug = 'public_safety';
  SELECT id INTO cat_other FROM categories WHERE slug = 'other';
  SELECT id INTO dep_elec FROM departments WHERE name = 'Electricity';
  SELECT id INTO dep_water FROM departments WHERE name = 'Water';
  SELECT id INTO dep_sani FROM departments WHERE name = 'Sanitation';
  SELECT id INTO dep_roads FROM departments WHERE name = 'Roads';

  IF NOT EXISTS (SELECT 1 FROM reports WHERE reporter_id = citizen_id) THEN
    INSERT INTO reports
      (reporter_id, category_id, title, description, latitude, longitude, address_text,
       severity, status, ai_category_suggestion, ai_confidence, ai_severity,
       assigned_department_id, assigned_worker_id, sla_deadline_at, resolved_at, created_at, updated_at)
    VALUES
      (citizen_id, cat_light, 'Street light not working on 2nd Street',
       'The street light near my house has been dead for 3 days. Very dark at night.',
       13.0418, 80.2341, 'Teynampet, 2nd Street', 'MEDIUM', 'ASSIGNED',
       cat_light, 0.82, 'MEDIUM', dep_elec, worker_id,
       now() + interval '20 hours', null, now() - interval '4 hours', now()),

      (citizen_id, cat_road, 'Large pothole on Anna Salai',
       'Dangerous pothole near the bus stop. Two-wheelers are at risk.',
       13.0367, 80.2350, 'Anna Salai, near bus stop', 'HIGH', 'IN_PROGRESS',
       cat_road, 0.78, 'HIGH', dep_roads, worker_id,
       now() + interval '40 hours', null, now() - interval '2 days', now()),

      (citizen_id, cat_drain, 'Drainage overflow in Ward 6',
       'Sewage water overflowing onto the road. Foul smell and health hazard.',
       13.0420, 80.2355, 'Teynampet, 4th Cross', 'HIGH', 'RESOLVED',
       cat_drain, 0.88, 'HIGH', dep_sani, worker_id,
       now() - interval '10 hours', now() - interval '2 hours', now() - interval '5 days', now() - interval '2 hours'),

      (citizen_id, cat_garbage, 'Garbage not collected for a week',
       'Bins are overflowing and stray dogs are scattering waste.',
       13.0450, 80.2360, 'Teynampet, Main Road', 'LOW', 'SUBMITTED',
       cat_garbage, 0.75, 'LOW', dep_sani, null,
       null, null, now() - interval '1 hour', now() - interval '1 hour'),

      (citizen_id, cat_water, 'No water supply for 2 days',
       'Metro water supply stopped suddenly. Entire street affected.',
       13.0500, 80.2400, 'Teynampet, 7th Street', 'HIGH', 'VERIFIED',
       cat_water, 0.84, 'HIGH', dep_water, null,
       now() + interval '30 hours', null, now() - interval '6 hours', now()),

      (citizen_id, cat_safety, 'Live electric wire hanging low',
       'Dangerous exposed wire near the park. Children play here.',
       13.0480, 80.2380, 'Near Natesan Park', 'CRITICAL', 'ASSIGNED',
       cat_safety, 0.91, 'CRITICAL', dep_elec, worker_id,
       now() + interval '6 hours', null, now() - interval '3 hours', now()),

      (citizen_id, cat_encroach, 'Footpath blocked by vendors',
       'Entire footpath occupied, forcing pedestrians onto the road.',
       13.0520, 80.2420, 'Teynampet, Market', 'MEDIUM', 'SUBMITTED',
       cat_encroach, 0.69, 'MEDIUM', dep_roads, null,
       null, null, now() - interval '2 hours', now() - interval '2 hours'),

      (citizen_id, cat_road, 'Broken sidewalk near school',
       'Sidewalk tiles broken, risk of tripping for school children.',
       13.0390, 80.2330, 'Near PSBB School', 'MEDIUM', 'RESOLVED',
       cat_road, 0.72, 'MEDIUM', dep_roads, worker_id,
       now() - interval '1 day', now() - interval '1 day', now() - interval '8 days', now() - interval '1 day'),

      (citizen_id, cat_light, 'Multiple street lights flickering',
       'Three consecutive lights flickering on 5th Street.',
       13.0430, 80.2370, 'Teynampet, 5th Street', 'LOW', 'VERIFIED',
       cat_light, 0.80, 'LOW', dep_elec, null,
       now() + interval '18 hours', null, now() - interval '10 hours', now()),

      (citizen_id, cat_garbage, 'Construction debris dumped on road',
       'Large pile of debris blocking half the road.',
       13.0460, 80.2390, 'Teynampet, 3rd Street', 'MEDIUM', 'REJECTED',
       cat_garbage, 0.66, 'MEDIUM', dep_sani, null,
       null, null, now() - interval '3 days', now() - interval '2 days'),

      (citizen_id, cat_water, 'Broken pipe causing waterlogging',
       'Pipe burst near the corner, water flooding the street.',
       13.0510, 80.2410, 'Teynampet, 6th Cross', 'CRITICAL', 'IN_PROGRESS',
       cat_water, 0.86, 'CRITICAL', dep_water, worker_id,
       now() + interval '2 hours', null, now() - interval '5 hours', now()),

      (citizen_id, cat_drain, 'Manhole cover missing',
       'Open manhole on the main road. Very dangerous at night.',
       13.0470, 80.2395, 'Teynampet, Main Road', 'CRITICAL', 'ASSIGNED',
       cat_drain, 0.90, 'CRITICAL', dep_sani, worker_id,
       now() - interval '2 hours', null, now() - interval '14 hours', now());
  END IF;
END $$;
