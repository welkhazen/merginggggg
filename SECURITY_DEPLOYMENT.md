# Vercel Security Deployment Checklist

Use this checklist before sharing any raW Vercel URL outside the team.

## Vercel project settings

1. Open **Vercel → Project → Settings → Deployment Protection**.
2. Enable one of these for preview deployments and any invite-only production period:
   - **Vercel Authentication** for team-only access.
   - **Password Protection** for external testers.
   - **Trusted IPs** for office/VPN-only access.
3. Keep production on a custom domain when possible and avoid sharing generated `*.vercel.app` URLs.
4. Review **Vercel → Project → Settings → Environment Variables** and keep server-only secrets out of browser prefixes:
   - Do not prefix service keys or private API keys with `VITE_`, `NEXT_PUBLIC_`, or `PUBLIC_`.
   - Rotate any secret that was ever exposed with a public prefix.

## Repository safeguards

- Production source maps are disabled in `vite.config.ts`.
- Vercel response headers in `vercel.json` deny framing, block MIME sniffing, restrict referrers, set HSTS, and apply a production CSP.
- `public/robots.txt` disallows indexing, but this is not access control. Use Vercel Deployment Protection for private/beta access.

## Supabase safeguards

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only in Vercel environment variables.
- Verify Row Level Security is enabled on every public table.
- Confirm storage bucket policies only allow the intended anonymous reads/writes.
- Run migrations and Supabase advisor checks before launch.

## Better alternative for private beta

For the smoothest private-beta flow, use a custom staging domain protected by Vercel Authentication or Password Protection, and reserve the production custom domain for public launch. This avoids testers bookmarking generated deployment URLs and keeps preview deployments private by default.
