# Supabase Setup Guide

## Quick Setup

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Wait for it to initialize

### 2. Get Your Credentials
1. Go to **Settings** → **API**
2. Copy **Project URL** → `VITE_SUPABASE_URL`
3. Copy **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 3. Create `.env` File
Create `.env` in project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Database Schema
1. Go to Supabase Dashboard → **SQL Editor**
2. Copy entire contents of `supabase/schema.sql`
3. Paste and click **Run**

### 5. Start Development
```bash
npm run dev
```

## What the Schema Creates

- **Tables**: users, decks, cards, comments, ratings, warnings
- **RLS Policies**: Secure access control for all tables
- **Auto Profile**: Trigger creates user profile on signup
- **Indexes**: For better query performance

## Troubleshooting

### "Invalid API key"
- Check `.env` has correct values
- Restart dev server after editing `.env`

### "Row Level Security policy violation"
- Make sure you ran `schema.sql` completely
- Check user is authenticated

### Login works but profile missing
- The trigger should auto-create profiles
- If not, check Supabase Logs for errors
