-- UB Housing Map — Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Create enum types
create type listing_type as enum ('room_available', 'sublease');
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
  sublease_end_date     date,
  lease_duration_months integer,
  contact_phone         text not null,
  contact_name          text not null,
  photos                text[] default '{}',
  amenities             text[] default '{}',
  floor_level           integer,
  food_preference       text,
  user_id               uuid references auth.users(id),
  is_active             boolean not null default true,
  edit_token            uuid not null default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  expires_at            timestamptz not null default (now() + interval '30 days')
);

-- Index for fast geo bounding-box queries
create index listings_lat_lng on listings (latitude, longitude);

-- Index for active listing queries
create index listings_active on listings (is_active, expires_at);

-- Row Level Security
alter table listings enable row level security;

create policy "Anyone can read active listings"
  on listings for select
  using (is_active = true and expires_at > now());

create policy "Authenticated users can insert"
  on listings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own listings"
  on listings for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own listings"
  on listings for delete
  to authenticated
  using (auth.uid() = user_id);
