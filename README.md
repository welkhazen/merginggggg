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

---

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
