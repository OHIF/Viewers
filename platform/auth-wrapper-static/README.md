# Auth Gate — Static Supabase Magic Link

Static authentication gate for OHIF Viewer.

## Purpose

This project provides a **login gate** in front of an existing OHIF Viewer.
The viewer itself is NOT modified.

Flow:
1. User visits `gate.doctoracademiapc.com.ar`
2. Enters email
3. Receives Supabase Magic Link
4. After login, user is redirected to the viewer

## Tech

- Plain HTML + CSS + JS
- Supabase Auth (Magic Link)
- No frameworks
- No iframe
- No changes to OHIF Viewer

## Environment Variables

Configured in deployment platform (Vertex):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Redirect

After successful authentication, users are redirected to:


