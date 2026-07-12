# RAW moderation dashboard (standalone admin portal)

A standalone admin portal for [www.myraw.app](https://www.myraw.app), connected to the **same live Supabase
database** as the main site — so the same staff logins work in both places.

## Staff tiers

Four global tiers, each inheriting the abilities of the tier below (stored in `users.staff_tier`;
`users.role` stays `admin`/`moderator` so the main myraw.app admin checks keep working):

| Tier | Adds access to |
| --- | --- |
| **Moderator** | Overview, community rooms (inspect/lock, delete messages), reports, flagged content, moderate users |
| **Admin** | User directory & appeals, community requests, donations & token requests, word filters, invites, analytics |
| **Owner** | Staff management, audit log |
| **Super admin** | System & errors (error events, Vercel deployments, Supabase health), granting owner/super admin |

Every mutating action is recorded in the `admin_audit_log` table.

## Running locally

```sh
npm install
cp .env.example .env.local   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET
npm run server:dev           # API on :8787
npm run dev                  # UI on :8080 (proxies /api to :8787)
```

## Deploying to Vercel

The repo ships with `vercel.json` + `api/index.ts`: the Vite build is served statically and every
`/api/*` request runs the Express app as a serverless function (sessions are stateless signed
cookies, so no session store is needed). Set at least `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
and `SESSION_SECRET` in the Vercel project; see `.env.example` for the optional integrations
(PostHog analytics tab, Resend crash alerts, Vercel deployments panel, Supabase health panel).

Database migrations live in `supabase/migrations/`.

If any backend or vendor credentials may be exposed, follow `SECURITY_ROTATION.md` before shipping more changes.
