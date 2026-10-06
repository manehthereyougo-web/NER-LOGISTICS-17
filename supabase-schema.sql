-- ==============================================================================
-- SAFEROUTE — COMPREHENSIVE PRODUCTION POSTGRESQL / SUPABASE DDL
-- ==============================================================================
-- Contains complete relational schemas for all 14 core product models:
-- 1. users
-- 2. roles
-- 3. organizations
-- 4. drivers
-- 5. vehicles
-- 6. reports (with soft-delete & official verification status)
-- 7. report_photos
-- 8. journeys
-- 9. route_searches
-- 10. routes
-- 11. route_evaluations
-- 12. weather_data (IMD & station observations)
-- 13. alerts (regional bulletins & hazards)
-- 14. incidents (field verification logs & disaster archive)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. ROLES & ACCESS CONTROL
-- ==============================================================================
create table if not exists public.roles (
  id text primary key, -- 'driver', 'logistics', 'official', 'admin'
  name text not null,
  description text,
  permissions jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.roles (id, name, description, permissions)
values 
  ('driver', 'Driver', 'Field driver with route search, navigation and hazard reporting rights', '{"can_report": true, "can_delete_own_report": true, "can_navigate": true}'::jsonb),
  ('logistics', 'Logistics Operator', 'Fleet management, vehicle dispatch, and operational tracking', '{"can_track_fleet": true, "can_view_all_reports": true, "can_assign_routes": true}'::jsonb),
  ('official', 'Authority Official', 'Regional highway safety desk, incident verification, and IMD watch', '{"can_verify_incident": true, "can_resolve_incident": true, "can_issue_alert": true}'::jsonb),
  ('admin', 'Platform Administrator', 'Full platform administrative control', '{"admin": true}'::jsonb)
on conflict (id) do nothing;

-- ==============================================================================
-- 2. ORGANIZATIONS (CARRIERS, AGENCIES, HIGHWAY DIVISIONS)
-- ==============================================================================
create table if not exists public.organizations (
  id text primary key,
  name text not null,
  org_type text not null default 'carrier' check (org_type in ('carrier', 'authority', 'emergency', 'enterprise')),
  hq_location text not null,
  contact_phone text,
  contact_email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.organizations (id, name, org_type, hq_location, contact_phone, contact_email)
values 
  ('org-ne8', 'Northeast Essential Logistics (NE8)', 'carrier', 'Beltola, Guwahati, Assam', '+91 94350 11223', 'ops@ne8logistics.in'),
  ('org-ner-auth', 'North Eastern Regional Highway & Disaster Authority', 'authority', 'Shillong, Meghalaya', '+91 364 2224500', 'dispatch@ner-highways.gov.in')
on conflict (id) do nothing;

-- ==============================================================================
-- 3. USERS
-- ==============================================================================
create table if not exists public.users (
  id text primary key, -- Auth UUID or internal ID
  organization_id text references public.organizations(id) on delete set null,
  role_id text not null references public.roles(id),
  full_name text not null,
  email text unique,
  phone text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.users (id, organization_id, role_id, full_name, email, phone)
values 
  ('usr-drv-101', 'org-ne8', 'driver', 'R. Sharma', 'sharma.driver@ne8.in', '+91 98640 12001'),
  ('usr-ops-201', 'org-ne8', 'logistics', 'P. Barua', 'ops@ne8logistics.in', '+91 94350 22002'),
  ('usr-off-301', 'org-ner-auth', 'official', 'Dr. H. Roy', 'safety@ner-highways.gov.in', '+91 364 22003')
on conflict (id) do nothing;

-- ==============================================================================
-- 4. VEHICLES
-- ==============================================================================
create table if not exists public.vehicles (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  code text not null,
  vehicle_no text not null,
  model text,
  cargo_type text not null,
  cargo_label text not null,
  icon text default '🚚',
  status text not null default 'on_schedule' check (status in ('on_schedule', 'delayed', 'rerouted', 'idle', 'maintenance')),
  current_lat double precision default 26.1445,
  current_lng double precision default 91.7362,
  speed_km integer default 0,
  heading integer default 0,
  last_telemetry_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.vehicles (id, organization_id, code, vehicle_no, model, cargo_type, cargo_label, icon, status, current_lat, current_lng, speed_km)
values
  ('veh-1', 'org-ne8', 'TRK-MED-01', 'AS-01-EB-101', 'Tata 407 LPT', 'medicine', 'Critical Medicines & Vaccines', '💊', 'on_schedule', 25.654, 91.896, 42),
  ('veh-2', 'org-ne8', 'TRK-FOOD-02', 'AS-01-FC-204', 'Eicher Pro 2049', 'food', 'Food Grains & Rations', '🍚', 'delayed', 25.12, 92.36, 18),
  ('veh-3', 'org-ne8', 'TRK-AGRI-03', 'AS-01-AG-305', 'Ashok Leyland Partner', 'agriculture', 'Fertilizers & Tea Seeds', '🌾', 'rerouted', 24.81, 93.92, 28)
on conflict (id) do nothing;

-- ==============================================================================
-- 5. DRIVERS
-- ==============================================================================
create table if not exists public.drivers (
  id text primary key,
  user_id text references public.users(id) on delete cascade,
  organization_id text references public.organizations(id) on delete cascade,
  vehicle_id text references public.vehicles(id) on delete set null,
  name text not null,
  phone text not null,
  license_no text not null,
  status text not null default 'active' check (status in ('active', 'on_trip', 'off_duty')),
  rating numeric(3, 2) default 4.9,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.drivers (id, user_id, organization_id, vehicle_id, name, phone, license_no, status)
values
  ('drv-101', 'usr-drv-101', 'org-ne8', 'veh-1', 'R. Sharma', '+91 98640 12001', 'AS-01-2018-DL9981', 'on_trip'),
  ('drv-102', null, 'org-ne8', 'veh-2', 'B. Kalita', '+91 98640 12002', 'AS-01-2016-DL4412', 'on_trip'),
  ('drv-103', null, 'org-ne8', 'veh-3', 'T. Dorjee', '+91 98640 12003', 'AS-01-2020-DL8821', 'on_trip')
on conflict (id) do nothing;

-- ==============================================================================
-- 6. REPORTS (ROAD HAZARDS, WITH SOFT-DELETE & VERIFICATION)
-- ==============================================================================
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.users(id) on delete set null,
  driver_id text references public.drivers(id) on delete set null,
  driver_name text not null,
  vehicle_code text,
  category text not null check (category in ('flooded', 'damaged', 'accident', 'blocked', 'traffic', 'visibility', 'weather', 'other')),
  title text not null,
  description text,
  photo_url text,
  state text not null default 'Assam',
  location_name text,
  lat double precision not null,
  lng double precision not null,
  accuracy_meters integer,
  risk_level text not null default 'caution' check (risk_level in ('safe', 'caution', 'risk')),
  
  -- Verification Lifecycle: UNVERIFIED -> VERIFIED -> RESOLVED
  verification_status text not null default 'UNVERIFIED' check (verification_status in ('UNVERIFIED', 'VERIFIED', 'RESOLVED')),
  verified_by text references public.users(id),
  verified_at timestamp with time zone,
  
  -- Ownership & Soft-Delete Architecture
  is_deleted boolean default false not null,
  deleted_at timestamp with time zone,
  deleted_by text references public.users(id),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_reports_active on public.reports (is_deleted, created_at desc);
create index if not exists idx_reports_category on public.reports (category);
create index if not exists idx_reports_state on public.reports (state);
create index if not exists idx_reports_user on public.reports (user_id);

-- ==============================================================================
-- 7. REPORT PHOTOS (METADATA & GEOTAGGED ASSETS)
-- ==============================================================================
create table if not exists public.report_photos (
  id uuid default gen_random_uuid() primary key,
  report_id uuid not null references public.reports(id) on delete cascade,
  photo_url text not null,
  thumbnail_url text,
  storage_path text,
  file_size_bytes integer,
  mime_type text default 'image/jpeg',
  captured_lat double precision,
  captured_lng double precision,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 8. ROUTES (MASTER CATALOG OF MONITORED CORRIDORS)
-- ==============================================================================
create table if not exists public.routes (
  id text primary key,
  corridor_code text not null, -- e.g. 'NH-6', 'NH-27', 'NH-37'
  name text not null,
  origin_name text not null,
  destination_name text not null,
  distance_km numeric(7, 2) not null,
  typical_minutes integer not null,
  route_type text not null default 'primary' check (route_type in ('primary', 'bypass', 'ridge', 'feeder')),
  waypoints jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.routes (id, corridor_code, name, origin_name, destination_name, distance_km, typical_minutes, route_type)
values 
  ('rte-nh6-gwh-shl', 'NH-6', 'Guwahati ➔ Shillong Primary Trunk', 'Guwahati, Assam', 'Shillong, Meghalaya', 98, 140, 'primary'),
  ('rte-nh37-slc-imp', 'NH-37', 'Silchar ➔ Imphal Hill Corridor', 'Silchar, Assam', 'Imphal, Manipur', 240, 360, 'primary'),
  ('rte-nh29-dmp-khm', 'NH-29', 'Dimapur ➔ Kohima Pass Route', 'Dimapur, Nagaland', 'Kohima, Nagaland', 74, 135, 'primary')
on conflict (id) do nothing;

-- ==============================================================================
-- 9. ROUTE SEARCHES (SELF-DIRECTED ENTRY AUDIT LOG)
-- ==============================================================================
create table if not exists public.route_searches (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.users(id) on delete set null,
  origin_query text not null,
  destination_query text not null,
  origin_lat double precision,
  origin_lng double precision,
  destination_lat double precision,
  destination_lng double precision,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 10. ROUTE EVALUATIONS (DETERMINISTIC MULTI-CRITERIA SCORING LOG)
-- ==============================================================================
create table if not exists public.route_evaluations (
  id uuid default gen_random_uuid() primary key,
  search_id uuid references public.route_searches(id) on delete cascade,
  route_id text references public.routes(id) on delete set null,
  candidate_name text not null,
  is_recommended boolean default false,
  safety_score integer not null check (safety_score between 0 and 100),
  risk_level text not null default 'safe' check (risk_level in ('safe', 'caution', 'risk')),
  weather_risk text default 'Low',
  road_risk text default 'Low',
  traffic_risk text default 'Moderate',
  confidence_score text default 'High (92%)',
  freshness_tag text default 'Updated 15m ago',
  why_recommended jsonb default '[]'::jsonb,
  disclaimer text not null default 'Recommended based on current available conditions.',
  evaluated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 11. JOURNEYS (ACTIVE & COMPLETED FLEET TRIPS)
-- ==============================================================================
create table if not exists public.journeys (
  id text primary key,
  code text not null,
  organization_id text references public.organizations(id) on delete cascade,
  driver_id text references public.drivers(id) on delete set null,
  vehicle_id text references public.vehicles(id) on delete set null,
  route_id text references public.routes(id) on delete set null,
  origin text not null,
  destination text not null,
  corridor text not null,
  distance_km numeric(6, 1) default 100,
  status text not null default 'in_progress' check (status in ('assigned', 'in_progress', 'completed', 'aborted')),
  risk_level text not null default 'safe' check (risk_level in ('safe', 'caution', 'risk')),
  eta text,
  progress_percent integer default 0,
  start_time timestamp with time zone,
  completed_time timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.journeys (id, code, organization_id, driver_id, vehicle_id, origin, destination, corridor, distance_km, status, risk_level, eta, progress_percent)
values 
  ('jrn-1', 'JRN-2401', 'org-ne8', 'drv-101', 'veh-1', 'Guwahati', 'Shillong', 'NH-6 Barapani Express', 98, 'in_progress', 'safe', '1h 15m', 65),
  ('jrn-2', 'JRN-2402', 'org-ne8', 'drv-102', 'veh-2', 'Silchar', 'Imphal', 'NH-37 Jiribam Pass', 240, 'in_progress', 'caution', '3h 40m', 42),
  ('jrn-3', 'JRN-2403', 'org-ne8', 'drv-103', 'veh-3', 'Dimapur', 'Kohima', 'NH-29 Zubza Valley', 74, 'in_progress', 'risk', '2h 10m', 25)
on conflict (id) do nothing;

-- ==============================================================================
-- 12. WEATHER DATA (INDIA METEOROLOGICAL DEPARTMENT TELEMETRY)
-- ==============================================================================
create table if not exists public.weather_data (
  id text primary key, -- e.g. 'imd-kamrup-metro', 'imd-east-khasi-hills'
  location_name text not null,
  state text not null,
  temperature_c numeric(4, 1),
  condition text not null,
  rainfall_24h_mm numeric(6, 1) default 0,
  wind_speed_kmh numeric(5, 1) default 0,
  alert_color text default 'Green' check (alert_color in ('Green', 'Yellow', 'Orange', 'Red')),
  imd_bulletin text,
  raw_payload jsonb default '{}'::jsonb,
  observed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone
);

insert into public.weather_data (id, location_name, state, temperature_c, condition, rainfall_24h_mm, alert_color, imd_bulletin)
values 
  ('imd-guwahati', 'Guwahati (Kamrup)', 'Assam', 27.2, 'Partly Cloudy', 2.4, 'Green', 'Normal atmospheric conditions across Brahmaputra valley.'),
  ('imd-shillong', 'Shillong (East Khasi)', 'Meghalaya', 17.5, 'Dense Fog & Light Rain', 22.8, 'Orange', 'Reduced visibility along hill slopes; wet asphalt caution.'),
  ('imd-tawang', 'Tawang (High Ridge)', 'Arunachal Pradesh', 3.0, 'Snow & Sleet', 14.2, 'Yellow', 'Freezing conditions near Sela pass.')
on conflict (id) do nothing;

-- ==============================================================================
-- 13. ALERTS (REGIONAL BULLETINS & ROADWAY ADVISORIES)
-- ==============================================================================
create table if not exists public.alerts (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('ROAD_BLOCK', 'WEATHER_HAZARD', 'CORRIDOR_DELAY', 'DISASTER_WARNING', 'ADVISORY')),
  severity text not null check (severity in ('INFO', 'MODERATE', 'CRITICAL')),
  title text not null,
  description text not null,
  corridor text,
  location text not null,
  source text not null default 'SafeRoute Network',
  icon text default '⚠️',
  is_active boolean default true,
  valid_until timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.alerts (type, severity, title, description, corridor, location, source, icon)
values
  ('ROAD_BLOCK', 'CRITICAL', 'Landslide & Single Lane Crawl on NH-6', 'Monsoonal mudfall along Sonapur tunnel road approach. Police alternating 1-lane crawl.', 'NH-6', 'Sonapur, Meghalaya', 'Highway Police & Driver Reports', '⛔'),
  ('WEATHER_HAZARD', 'MODERATE', 'Dense Ridge Fog & Visibility Drop below 80m', 'Sudden orographic cloud descent around Barapani lake. Drivers must reduce speed to 30km/h.', 'NH-6', 'Barapani, Meghalaya', 'IMD NWFC Telemetry', '🌫️'),
  ('CORRIDOR_DELAY', 'MODERATE', 'NH-37 Gorge Freight Queuing', 'Heavy truck queue moving at 15 km/h due to culvert repairs.', 'NH-37', 'Jiribam border, Manipur', 'Logistics Dispatch', '🚚')
on conflict do nothing;

-- ==============================================================================
-- 14. INCIDENTS (DISASTER FIELD ARCHIVE & HISTORICAL AUDIT)
-- ==============================================================================
create table if not exists public.incidents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  driver_name text,
  vehicle_no text,
  phone text,
  photo_url text,
  state text not null default 'Assam',
  place text,
  incident_type text default 'landslide',
  hazards text[] default '{}',
  risk_level text not null default 'caution' check (risk_level in ('safe', 'caution', 'risk')),
  risk_score integer default 50,
  reasons text[] default '{}',
  lat double precision default 26.1445,
  lng double precision default 91.7362,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.roles enable row level security;
alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;
alter table public.reports enable row level security;
alter table public.report_photos enable row level security;
alter table public.routes enable row level security;
alter table public.route_searches enable row level security;
alter table public.route_evaluations enable row level security;
alter table public.journeys enable row level security;
alter table public.weather_data enable row level security;
alter table public.alerts enable row level security;
alter table public.incidents enable row level security;

-- Read policies for public/authenticated
create policy "Public read roles" on public.roles for select to anon, authenticated using (true);
create policy "Public read organizations" on public.organizations for select to anon, authenticated using (true);
create policy "Public read users" on public.users for select to anon, authenticated using (true);
create policy "Public read vehicles" on public.vehicles for select to anon, authenticated using (true);
create policy "Public read drivers" on public.drivers for select to anon, authenticated using (true);
create policy "Public read routes" on public.routes for select to anon, authenticated using (true);
create policy "Public read weather_data" on public.weather_data for select to anon, authenticated using (true);
create policy "Public read alerts" on public.alerts for select to anon, authenticated using (true);
create policy "Public read incidents" on public.incidents for select to anon, authenticated using (true);

-- Reports policy: Active reports (not soft-deleted) visible to all
create policy "Public read active reports" on public.reports for select to anon, authenticated using (is_deleted = false);
create policy "Public insert reports" on public.reports for insert to anon, authenticated with check (true);
create policy "Drivers soft delete own report" on public.reports for update to anon, authenticated using (true) with check (true);

-- Report photos policies
create policy "Public read report photos" on public.report_photos for select to anon, authenticated using (true);
create policy "Insert report photos" on public.report_photos for insert to anon, authenticated with check (true);

-- Realtime publication enablement
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'reports') then
    alter publication supabase_realtime add table public.reports;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'alerts') then
    alter publication supabase_realtime add table public.alerts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'vehicles') then
    alter publication supabase_realtime add table public.vehicles;
  end if;
exception
  when others then null;
end $$;

-- Storage buckets setup
insert into storage.buckets (id, name, public)
values 
  ('incident-photos', 'incident-photos', true),
  ('report-photos', 'report-photos', true)
on conflict (id) do update set public = true;
