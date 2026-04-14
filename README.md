# UB Housing

A map-based housing listing website for University at Buffalo students. Find rooms, subleases, and roommates — no account required.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | [account.mapbox.com](https://account.mapbox.com/) → Tokens |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally |

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL Editor
3. Paste and run `supabase/schema.sql`

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploying to Vercel

1. Push to GitHub, import into Vercel
2. Add all env vars in Vercel project settings
3. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL
4. Deploy

---

## Project Structure

```
app/
  page.tsx              # Main map page
  post/page.tsx         # Post a listing form
  post/success/         # Success + edit link page
  listing/[id]/         # Listing detail view
  edit/[token]/         # Edit / delete listing
  api/listings/         # REST API routes

components/
  Map.tsx               # Mapbox map with pins
  ListingCard.tsx       # Card shown on pin click
  FilterBar.tsx         # Filter controls
  ListingForm.tsx       # Shared post/edit form
  LocationPicker.tsx    # Address autocomplete + pin drop

lib/
  supabase.ts           # Supabase client
  types.ts              # TypeScript types + constants
  utils.ts              # WhatsApp URL, date helpers

supabase/
  schema.sql            # Run this in Supabase SQL editor
```

## How it works

- No login — anyone can post
- Each listing gets a secret `edit_token` shown once after posting
- Use `/edit/[token]` to edit, mark as filled, or delete
- Listings expire after 30 days (filtered in queries, not deleted from DB)
