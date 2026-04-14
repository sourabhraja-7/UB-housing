-- UB Housing Map — Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Create enum types
create type listing_type as enum ('room_available', 'sublease', 'roommate_needed');
create type gender_preference as enum ('any', 'male', 'female');

-- Create listings table
create table listings (
  id                    uuid primary key default gen_random_uuid(),
  type                  listing_type not null,
  title                 text not null,
  description           text,
  rent                  integer not null,
  bedrooms              integer not null default 1,
  bathrooms             integer not null default 1,
  address               text not null,
  latitude              float not null,
  longitude             float not null,
  furnished             boolean not null default false,
  utilities_included    boolean not null default false,
  gender_preference     gender_preference not null default 'any',
  available_date        date,
  lease_duration_months integer,
  contact_phone         text not null,
  contact_name          text not null,
  photos                text[] default '{}',
  is_active             boolean not null default true,
  edit_token            uuid not null default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  expires_at            timestamptz not null default (now() + interval '30 days')
);

-- Index for fast geo bounding-box queries
create index listings_lat_lng on listings (latitude, longitude);

-- Index for active listing queries
create index listings_active on listings (is_active, expires_at);

-- Row Level Security — allow public read of active listings
alter table listings enable row level security;

create policy "Anyone can read active listings"
  on listings for select
  using (is_active = true and expires_at > now());

create policy "Anyone can insert listings"
  on listings for insert
  with check (true);

create policy "Anyone with edit_token can update"
  on listings for update
  using (true);

create policy "Anyone with edit_token can delete"
  on listings for delete
  using (true);
