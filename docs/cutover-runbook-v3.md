# raW — Supabase repoint cutover runbook (v3)

**Supersedes** the v1/v2 runbook and the "execution brief". Everything below is
**repo-verified** — unlike the session that wrote v2 (repos were private then),
both `welkhazen/wzwznew` and `welkhazen/merginggggg` are readable, so the
env-var names, client method, DB surface, and hardcoded fallbacks are read from
source, not guessed.

## Goal
Repoint raW production **back** to Supabase project `iktusezbedndctnzhtwh`
("OLD"), abandoning `byegheluxjxrqrmrpini` ("NEW") for the user app. No data
migration; NEW's post-switch data is abandoned by design; NEW is never
overwritten (it stays intact as the lossless rollback copy).

Two apps are in scope:
| App | Repo | Role | Vercel project (team `rawtester`) | Domain | Situation |
|---|---|---|---|---|---|
| User app | `wzwznew` | end-user PWA | `wzwznew` (`prj_IOmtCLi1VgXurykWhZHdugmPDZZa`) | `myraw.app` | **Real flip** — currently points at NEW (`byeg…`) |
| Admin app | `merginggggg` | staff/admin dashboard | `merginggggg` (`prj_6aEfRbLiCUNnJ7XE2ALtNWv3yN6B`) | its admin domain | **Verify/repoint** — built against OLD (`iktus…`); zero `byeg…` refs |

## Corrections vs v2 / the brief (all repo-verified)
1. **Method = ENV for both apps.** Both build the Supabase client from
   `import.meta.env` / `process.env`. **No code edit is required** — the swap is
   env-only. (v2 couldn't determine this.)
2. **The 4-variable swap in `VERCELENVSWAPEXACTSTEPS.md` / `REPOANALYSIS.md` is
   missing `SUPABASE_JWT_SECRET`.** That file claims it's "NOT read by the code";
   it is — `api/_lib/sessionAuth.ts` mints and verifies the `raw_session` cookie
   with it. Without it, login and every authenticated `/api/*` break at cutover.
   `SUPABASE_PUBLISHABLE_KEY` (server), by contrast, is genuinely optional (falls
   back to `VITE_SUPABASE_PUBLISHABLE_KEY`). Required set = **5 vars** (see App A).
3. **wzwznew has a hardcoded fallback to `https://byegheluxjxrqrmrpini.supabase.co`**
   in `src/backend/supabase/client.ts` and `api/_lib/supabaseServerClient.ts`.
   If any prod env var is left **empty/unset**, the app silently reverts to NEW —
   no error. **Overwrite every var; never blank one out.**
4. **wzwznew drift surface is far bigger than v2 said** (~37 tables / ~33 RPCs,
   not 10/7). See the code-derived lists below — check every one against OLD
   before flipping.
5. **merginggggg `vercel.json` CSP uses a `*.supabase.co` wildcard**
   (`connect-src 'self' https://*.supabase.co wss://*.supabase.co …`) — no
   project ref is hardcoded there, so no `vercel.json` change is needed.

## Who does what (access reality)
- **Claude Code (repo session):** repo analysis, code edits, commits/pushes,
  and producing the exact SQL + checklists here. **Cannot** reach the Supabase or
  Vercel dashboards, and cannot drive your logged-in Chrome tabs.
- **You / Claude-on-Chrome:** every Supabase and Vercel dashboard action below.
- **Supabase MCP** is currently connected to an account with **zero project
  access** (`list_projects` empty; `iktus…` → permission denied). To run the
  drift SQL / advisors via tooling, reconnect it (Claude → Settings → Connectors
  → Supabase → grant the org holding `iktusezbedndctnzhtwh` **and**
  `byegheluxjxrqrmrpini`). Otherwise just run the SQL in the Supabase dashboard
  SQL editor.

## Guardrails (hard)
- OLD (`iktusezbedndctnzhtwh`): **read-only** this pass, except explicitly
  approved **additive-only** migrations (create missing objects; never
  alter/drop/overwrite). Each migration approved individually.
- NEW (`byegheluxjxrqrmrpini`): **never** write, pause, or delete. It is the
  rollback copy.
- **No production change** until the preview smoke passes.

---

## App A — `wzwznew` (user app, real flip)

### Production env swap set — Vercel → project `wzwznew` → **Production**
| Var | Value | Sensitive? | Notes |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `https://iktusezbedndctnzhtwh.supabase.co` | no | **build-time** (Vite inlines) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | OLD's anon / publishable key | no | **build-time**; `VITE_SUPABASE_ANON_KEY` is an accepted alias |
| `SUPABASE_URL` | `https://iktusezbedndctnzhtwh.supabase.co` | no | server `/api/*` |
| `SUPABASE_PUBLISHABLE_KEY` | OLD's anon / publishable key | no | **optional** — falls back to `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | OLD's service_role / secret key | **yes** | mark Sensitive |
| `SUPABASE_JWT_SECRET` | OLD's JWT secret (Settings → API → JWT Settings) | **yes** | mark Sensitive; **required** — session auth |

> **Do NOT use a 4-variable swap.** `SUPABASE_JWT_SECRET` is **required**:
> `api/auth/login.ts` mints the `raw_session` cookie with it, and
> `getRequestUserId` (used by `/api/auth/me`, vote, chat, token-requests,
> onboarding, communities, admin auth — every authenticated route) verifies
> against it. Omit it and `mintAccessToken` returns `null`: login can't set a
> session and every authenticated `/api/*` returns 401. Set it to OLD's JWT
> secret. The minimal **required** set is therefore **5 vars** (all above except
> `SUPABASE_PUBLISHABLE_KEY`, which falls back to `VITE_SUPABASE_PUBLISHABLE_KEY`).

Because the two `VITE_*` vars are **inlined at build time**, after setting them
you **must redeploy with build cache OFF** or the old values stay baked in.

### A1 — Restore + verify OLD (read-only)
Supabase → `iktusezbedndctnzhtwh`: if paused, **Restore**; confirm ACTIVE and
note the Postgres major version. Then run the drift SQL (shared section below).
**Gate:** report any missing tables/RPCs/buckets before any prod change; each
gap → an additive-only migration (Phase 5) first.

**Code-derived DB surface OLD must have:**
- **Tables:** `polls, poll_options, poll_votes, poll_comments, users,
  user_aliases, user_xp_claims, user_progress, user_avatar_selection,
  user_avatar_inventory, user_accent_unlocks, user_community_unlocks,
  user_subscriptions, user_favorite_communities, avatar_catalog,
  landing_new_avatars, daily_spin_pool, communities, community_members,
  community_messages, community_polls, community_poll_options,
  community_poll_votes, community_waitlist, community_requests,
  notification_consents, moderation_flags, chat_reports, issue_reports,
  banned_words, blocked_words, founding_invites, founding_invite_redemptions,
  invite_waitlist_requests, token_requests, donation_interests, audit_logs`
- **RPCs:** `submit_poll_vote, get_polls_with_vote_counts,
  get_onboarding_progress_for_user, save_onboarding_identities_for_user,
  save_onboarding_progress_for_user, complete_user_onboarding_for_user,
  verify_user_password, create_user_with_password, update_user_password,
  claim_challenge_reward, spend_tokens, get_community_access, unlock_community,
  get_user_progress, award_xp, award_xp_once, get_user_xp_claim_keys,
  save_private_alias, set_chat_identity, get_waitlist_summary,
  join_community_waitlist, submit_community_request, create_community_from_request,
  update_community_presentation, delete_community_message, toggle_message_like,
  remove_user_from_message_likes, send_community_message, get_profile_stats,
  get_community_poll_summaries, is_early_signup_eligible,
  claim_early_signup_avatar, claim_free_spin_avatar`
- **Storage:** `avatars` bucket, public read.

### A2 — Preview rehearsal (no user impact)
Set the 6 vars above on **Preview**, deploy a preview (build cache OFF), run the
smoke list (shared section) against the preview URL. Do **not** proceed on any
failure → Phase 5, then re-run.

### A3 — Production cutover (low-traffic slot)
Set the same 6 vars on **Production**, redeploy **cache OFF**, run the smoke list
once against `https://myraw.app`. DNS untouched.

**Rollback (lossless, ~5 min):** restore the prior env values + `vercel rollback`
to `dpl_Br1zRqhdstetCYoeua7wMXovE6Cj`. NEW was never touched, so this restores the
exact pre-cutover state.

---

## App B — `merginggggg` (admin app, verify → repoint if needed)

merginggggg was built against OLD (`iktus…`) and has **no `byeg…` references**,
so its production may **already** point at OLD. Verify first; only set vars if it
doesn't.

### Production env set — Vercel → project `merginggggg` → **Production**
| Var | Value | Sensitive? | Notes |
|---|---|---|---|
| `SUPABASE_URL` | `https://iktusezbedndctnzhtwh.supabase.co` | no | **required** (server) |
| `SUPABASE_SERVICE_ROLE_KEY` | OLD's service_role / secret key | **yes** | **required**; mark Sensitive |
| `SESSION_SECRET` | a dedicated ≥32-char random secret | **yes** | recommended (see note) |
| `VITE_SUPABASE_URL` | `https://iktusezbedndctnzhtwh.supabase.co` | no | build-time; only if admin **realtime** is used |
| `VITE_SUPABASE_ANON_KEY` | OLD's anon / publishable key | no | build-time; only if admin realtime is used |

**Session-secret note:** `server/config/env.ts` derives `SESSION_SECRET` from
`SUPABASE_SERVICE_ROLE_KEY` when it's unset. So if you rely on the derived secret
and the service-role key value changes, **all admin sessions invalidate** (staff
re-login once). Setting a dedicated `SESSION_SECRET` decouples the two.

merginggggg's browser realtime client has **no hardcoded fallback** — if the
`VITE_*` pair is unset, admin community-message realtime simply reports
"unavailable" (graceful), it does **not** silently hit a wrong project.

### B steps
1. **Confirm current prod target:** Vercel → `merginggggg` → Settings → Env Vars
   → Production: read `SUPABASE_URL`. If it's already
   `https://iktusezbedndctnzhtwh.supabase.co`, no flip — go straight to smoke.
2. If it points elsewhere, set the vars above and redeploy (**cache OFF** if you
   set either `VITE_*`).
3. **Smoke (admin domain):** admin login works; System/Errors tab loads;
   Analytics tab loads; a community's chat admin view shows live messages
   (realtime) if that feature is enabled; token-request approve/reject round-trips.

---

## Shared reference

### Drift SQL (run against `iktusezbedndctnzhtwh`)
```sql
select tablename from pg_tables where schemaname='public' order by 1;
select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by 1;
select id, public from storage.buckets order by 1;   -- expect 'avatars', public=true
```
Cross-check the A1 lists. Any miss = a feature that breaks at cutover → Phase 5.

### Smoke checklist (wzwznew / user app)
- Cold load on **desktop** and **Telegram iOS WebView** — no error boundary.
- **Log in with a pre-switch account and its old password** (the star test).
- New signup lands in OLD's `auth.users` / `public.users`.
- Vote → `get_polls_with_vote_counts` increments **once**.
- XP / token / spin writes `user_avatar_inventory` (cols `user_id, avatar_id,
  purchased_at`).
- Avatars render (OLD's `avatars` bucket).
- Every `/api/*` returns 200, including `/api/auth/me`.

### Phase 5 — drift-gap protocol (only if a gap is found)
Per missing object the code needs: **one additive-only** migration on OLD
(create the missing table/column/RPC; never alter/drop/overwrite), each with a
verification query; or a small graceful-degrade code shim. Re-run the rehearsal
after fixes. Approve each migration individually.

### Phase 6 — hardening (start ≤24h after cutover; each migration approved)
Cutting over makes OLD's June audit holes live again. Staged, reviewable
grant/policy migrations (not data):
1. Revoke `anon` EXECUTE + gate on `auth.uid()` for `activate_subscription`,
   `award_xp`, `award_xp_once`, `spend_tokens`, `claim_early_signup_avatar`,
   `claim_free_spin_avatar`. Verify `has_function_privilege('anon', oid,
   'execute') = false` for all six.
2. Replace the ~20 `anon`-true write policies (esp. `polls` delete,
   `poll_options`, `communities`) with owner-scoped ones; collapse duplicate
   permissive pairs.
3. `avatars` bucket: keep public read, remove anonymous list.
4. `create index if not exists poll_options_poll_id_idx on poll_options(poll_id);`
   + `(select auth.uid())` rewrite on `users`, `user_progress`,
   `user_xp_claims` policies.
Exit: security advisors show none of the June findings.

### 48h bake
Vercel runtime errors + logs at 2h / 24h / 48h (zero new clusters); Sentry error
rate; PostHog `api_error` vs baseline. Expect some "my account is gone" reports
from people who signed up on the abandoned NEW project — intended; have a
one-line canned reply ready.

## Open items to confirm
- **wzwznew:** does any shipped Capacitor iOS build bake NEW's (`byeg…`) URL? If
  yes, NEW can't be paused/deleted until iOS is rebuilt against OLD, and
  current-build iOS users break at cutover.
- **merginggggg:** confirm its current Production `SUPABASE_URL` (verify vs flip),
  and its admin production domain for the smoke test.
- **Optional hardening (wzwznew):** the `byeg…` string literal remains a fallback
  in `client.ts` / `supabaseServerClient.ts`. Once the cutover is stable, consider
  replacing that fallback with `iktus…` (or removing it so a missing env var fails
  loudly instead of silently reverting). Surgical, separate change.
