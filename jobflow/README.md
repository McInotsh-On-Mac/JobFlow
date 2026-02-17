## JobFlow

JobFlow is a Next.js + Supabase app for tracking job applications.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `jobflow/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Schema

Run the SQL migrations in Supabase SQL Editor in this order:

1. `supabase/migrations/20260216_0001_mvp_schema.sql`
2. `supabase/migrations/20260216_0002_optional_extensions.sql` (optional add-ons)

The MVP migration creates:

- `profiles`
- `companies`
- `applications`
- `follow_ups`
- `notes`
- `links`

and includes:

- owner-safe foreign keys
- indexes for common queries
- RLS policies scoped to `auth.uid()`
- automatic profile creation trigger on `auth.users` insert

## Auth Flow

The app uses Supabase Auth (email/password):

- Public routes: `/login`, `/signup`
- Protected routes: `/`, `/dashboard`, `/applications`
- Session cookies are set server-side after login/signup
- Logout is available from the profile dropdown in the header

## Validate

```bash
npm run lint
npm run build -- --webpack
```
