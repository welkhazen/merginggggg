# Backend Account API + Supabase Setup

This backend now supports account management endpoints suitable for a Supabase-backed user store.

## What was added

- Profile read endpoint: `GET /api/users/me`
- Profile update endpoint: `PATCH /api/users/me`
- Password change endpoint: `POST /api/users/me/change-password`
- Repository abstraction (`server/lib/userRepository.ts`) with:
  - Memory implementation (default, no DB required)
  - Supabase REST implementation (enabled via env vars)

## Environment variables

Add the existing auth vars plus these optional Supabase vars to your backend environment file:

```env
# Existing required vars still apply
SESSION_SECRET=replace-with-long-random-value
PHONE_HMAC_KEY=replace-with-long-random-value
AUTH_PASSWORD_PEPPER=replace-with-long-random-value
BCRYPT_ROUNDS=12

# Optional: enable Supabase-backed users
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SCHEMA=public
SUPABASE_USERS_TABLE=app_users
```

If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are not provided, the backend falls back to in-memory users.

## Supabase SQL schema

Run this in Supabase SQL editor:

```sql
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  phone_hash text not null unique,
  display_name text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  password_changed_at timestamptz not null default now()
);

create index if not exists app_users_username_idx on public.app_users (username);
create index if not exists app_users_phone_hash_idx on public.app_users (phone_hash);
```

## API request/response examples

### Get current user

`GET /api/users/me`

Response:

```json
{
  "user": {
    "id": "a294f2de-cc8d-47d4-8f18-f2f7f7e8ff3e",
    "username": "rawwar_king",
    "displayName": "Raw War King",
    "bio": "No face. Real opinions.",
    "createdAt": "2026-04-15T10:12:31.339Z",
    "updatedAt": "2026-04-15T10:22:08.112Z",
    "passwordChangedAt": "2026-04-15T10:12:31.339Z"
  }
}
```

### Update profile

`PATCH /api/users/me`

Body:

```json
{
  "displayName": "Raw Warrior",
  "bio": "Anonymous but accountable"
}
```

### Change password

`POST /api/users/me/change-password`

Body:

```json
{
  "currentPassword": "OldPass#2025",
  "newPassword": "NewPass#2026"
}
```

Password policy:

- Length: 8-128
- Must include uppercase, lowercase, number, symbol
- Must differ from current password
