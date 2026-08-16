-- Private persistence for Owner Console affiliate-health decisions and image repairs.
-- Server-only tables: no anonymous or authenticated browser access.

create table if not exists public.affiliate_health_ignores (
  ignore_key text primary key,
  scope text not null check (scope in ('item', 'brand')),
  product_source text,
  product_id text,
  merchant_key text not null,
  warning_kind text not null,
  label text,
  ignored_at timestamptz not null default now()
);

comment on table public.affiliate_health_ignores is
  'Private owner choices to suppress specific affiliate health warnings without unpublishing products.';

alter table public.affiliate_health_ignores enable row level security;
revoke all on table public.affiliate_health_ignores from public, anon, authenticated;
grant select, insert, update, delete on table public.affiliate_health_ignores to service_role;

create table if not exists public.affiliate_catalog_image_overrides (
  product_id text primary key,
  product_source text not null check (product_source in ('builtin', 'uploaded')),
  image_url text not null,
  source_page_url text,
  updated_at timestamptz not null default now()
);

comment on table public.affiliate_catalog_image_overrides is
  'Private image repairs discovered from merchant product pages for published affiliate listings.';

alter table public.affiliate_catalog_image_overrides enable row level security;
revoke all on table public.affiliate_catalog_image_overrides from public, anon, authenticated;
grant select, insert, update, delete on table public.affiliate_catalog_image_overrides to service_role;
