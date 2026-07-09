# Emergency key rotation runbook

Use this runbook when a contractor, employee, vendor, laptop, CI runner, or chat transcript may have exposed environment variables. Treat every key that person could read as compromised.

## Immediate lock-down checklist

1. Remove the person's access everywhere before rotating secrets: GitHub, Vercel, Supabase, OpenAI, Stytch, PostHog, Resend, Twilio, DNS/registrar, Slack/Discord, password manager, and any shared email inboxes.
2. Turn on or verify MFA for every owner/admin account. Prefer hardware security keys for owners.
3. Rotate production first, then preview/staging, then local development secrets. Do not paste new values into chat or tickets.
4. Redeploy the app after updating hosted environment variables, then verify the app is using the new values.
5. Delete or revoke the old values after the deployment is confirmed healthy. If the provider supports immediate revocation, revoke first and accept brief downtime.
6. Review provider usage and audit logs for unusual calls, exports, failed logins, or billing spikes during the suspected exposure window.

## OpenAI API key rotation

1. Open the OpenAI platform API keys page for the affected organization/project.
2. Create a new **project-scoped** key for the app/environment that needs it. Prefer a service account or project key over a personal user's key.
3. Give the key only the permissions the app needs. If model access, endpoint permissions, budgets, or rate limits can be restricted, set them before rollout.
4. Store the new value only in your secret manager or host environment variable named `OPENAI_API_KEY`.
5. Redeploy every service that calls OpenAI and run a smoke test.
6. Delete/revoke every old key the former employee could access.
7. Review OpenAI usage and billing for abnormal traffic; contact OpenAI support if you see unauthorized usage.

OpenAI's current guidance is to rotate leaked keys immediately, avoid sharing personal API keys, use project-based keys for collaboration, store keys in environment variables or secret managers, set spend thresholds, and delete compromised keys from the API key dashboard.

## This repository's environment variables to rotate

Rotate all of these if the backend employee had repository, Vercel, local `.env`, terminal history, or password-manager access:

- `SUPABASE_SERVICE_ROLE_KEY` and any Supabase database credentials.
- `SESSION_SECRET` so old signed admin sessions cannot remain valid.
- `SUPABASE_MGMT_TOKEN` and `SUPABASE_PROJECT_REF` if the System tab uses Supabase management APIs.
- `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, and `VERCEL_PROJECT_ID` if deployment metadata is enabled.
- `POSTHOG_PROJECT_API_KEY`, `POSTHOG_PERSONAL_API_KEY`, and PostHog project tokens.
- `RESEND_API_KEY` and any sender-domain provider credentials.
- `PUSH_SEND_SECRET` shared with the user app.
- `VITE_STYTCH_PUBLIC_TOKEN` is public by design, but rotate Stytch private/dashboard credentials and review allowed redirect URLs.
- `VITE_SUPABASE_ANON_KEY` is public by design, but rotate it if you are also rotating Supabase JWT secrets or project API keys.
- `OPENAI_API_KEY` for any current or future server-side OpenAI integration.

## Safer operating model going forward

- Keep production secrets out of developer laptops. Use Vercel/Supabase integrations, a password manager with per-user sharing, or a dedicated secrets manager.
- Use one key per environment and service (`raw-prod-api`, `raw-preview-api`, `raw-local-dev`) so you can revoke narrowly.
- Avoid personal API keys for shared services. Use organization/project/service-account keys where the provider supports them.
- Give contractors least-privilege access and expiry dates; never give owner access unless there is a documented reason.
- Add billing alerts and low blast-radius budgets for AI providers.
- Run a secret scan before every release and after every incident.

## Local secret scan

Run this before pushing emergency rotation changes:

```sh
npm run secrets:scan
```

The scan checks tracked source files for common private key patterns while excluding dependency/build folders. It is a safety net, not a replacement for provider-side revocation and audit log review.
