# Auth Gate Postmortem

## Implementation Details

This implementation adds a frontend-only Supabase Magic Link authentication gate for the OHIF Viewer.

## Architecture Summary

- **supabaseClient.js**: Initializes Supabase client with persistSession and autoRefreshToken enabled
- **allowedUsers.js**: Validates users against the `allowed_users` table
- **AuthGate.jsx**: React wrapper with LOADING, AUTHORIZED, UNAUTHORIZED states
- **loginPage.jsx**: Magic link login page
- **index.js**: Conditionally wraps App with AuthGate based on AUTH_GATE_ENABLED

## Files Created

- platform/app/auth/supabaseClient.js
- platform/app/auth/allowedUsers.js
- platform/app/auth/AuthGate.jsx
- platform/app/loginPage.jsx

## Files Modified

- platform/app/src/index.js

## Required Environment Variables

- `AUTH_GATE_ENABLED`: Set to "true" to enable auth gate
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Supabase SQL Schema

```sql
CREATE TABLE allowed_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own data"
  ON allowed_users
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);
```

## Rollback Instructions

Set `AUTH_GATE_ENABLED=false` to disable the auth gate and use the viewer without authentication.
