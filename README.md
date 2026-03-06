# Synhax Battle Mode

Synhax is a real-time UI battle platform for HTML and CSS. Players compete by
recreating a visual target, while the app tracks progress with live diff scoring
and synced state.

This repository contains the full app: frontend, auth, realtime sync layer, API
endpoints, and database schema.

## What The Platform Does

- Hosts design recreation challenges called **targets** (code, image, or video
  based)
- Lets users run **solo** or **2-player** timed battles
- Tracks each submission as a **hax** (user HTML + CSS)
- Computes a live **diff score** (0-100) against the target
- Supports a lobby -> battle -> recap game flow
- Includes admin tools for managing users, targets, battles, and hax records

## Roles

- **Player**: joins battles, edits code, submits results
- **Referee/Host**: manages lobby settings, starts battles, controls battle flow
- **Admin (`syntax`)**: manages private targets, admin pages, and media upload
  tooling

## Battle Modes

- **SOLO**: one player against the timer
- **TIMED_MATCH**: two players in a head-to-head match
- **Win condition**: currently optimized for `FIRST_TO_PERFECT` (first to 100%
  diff score)

## How A Battle Works

1. A user starts from a target card in the dashboard.
2. A battle record, participant row, and hax row are created.
3. In the lobby, the host configures mode, timing, visibility, and lock-in.
4. During battle, each player output is rendered in a sandboxed iframe.
5. A diff engine compares player output to the target and persists score
   updates.
6. On completion, users can view recap data and target ratings.

## Realtime + Data Architecture

Synhax uses Zero for synced queries/mutations and Drizzle/Postgres for storage.

- **Client sync entry**: `src/lib/zero.svelte.ts`
- **Read layer**: `src/lib/queries.ts`
- **Write layer**: `src/lib/mutators.ts`
- **Query endpoint**: `src/routes/api/query/+server.ts`
- **Mutation endpoint**: `src/routes/api/mutate/+server.ts`
- **Database schema**: `src/db/schema.ts`

Zero context is passed from authenticated request state:

- Query context: `{ userID, userRole }`
- Mutation context: `{ userID, userRole }`

Permissions are enforced in query/mutator definitions (not with Zero
`definePermissions`).

## Local File Editing Model

The platform is built around the browser File System Access API.

- Players grant access to a local folder
- Synhax creates/loads battle files (`index.html`, `styles.css`)
- Local file changes are polled and synced into `hax` + `hax_history`

Important:

- Chrome/Edge-style File System Access support is required
- `https` or `localhost` is required for file system permissions

Implementation: `src/lib/state/FileState.svelte.ts`

## Target Types

- `CODE`: structured target HTML/CSS (with optional starter code)
- `IMAGE`: static visual reference
- `VIDEO`: video reference

Admin target creation/editing lives at:

- `src/routes/(style)/(menu)/admin/targets/TargetForm.svelte`

## Tailwind In Battle Submissions

Battle previews support Tailwind CSS v4 from CDN in sandboxed output.

- Add `@import "tailwindcss";` in battle CSS to enable it
- Tailwind is injected only when that import is detected

Implementation: `src/utils/code.ts`

## Tech Stack

- SvelteKit 2 + Svelte 5
- Zero (`@rocicorp/zero`) + `zero-svelte`
- Drizzle ORM + Postgres
- Better Auth (GitHub OAuth + JWT/bearer support)
- Cloudflare deployment target (Workers)
- Sentry client instrumentation with telemetry tunnel endpoint

## Route Map

- `/` - login/start screen
- `/dashboard` - targets + your battles
- `/lobby/:id` - pre-battle setup and lock-in
- `/battle/:id/code` - active coding/battle view
- `/battle/:id/code/breakout` - detached output window
- `/ref/:id` - referee control view
- `/recap/:id` - post-battle recap
- `/history` - player battle history
- `/settings` - local folder + account controls
- `/admin/*` - admin-only management screens

## Environment Variables

These are the key variables used by this app:

- `DB_URL` - runtime Postgres connection string for Cloudflare Workers
- `ZERO_UPSTREAM_DB` - Postgres connection string fallback (local/dev + Drizzle
  CLI)
- `PUBLIC_SERVER` - Zero server URL used by the client sync layer
- `GITHUB_CLIENT_ID` - GitHub OAuth client id
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `IV_API_KEY` - API key for admin media upload proxy endpoints

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment variables (`.env` or platform env).

3. Push schema to Postgres:

```bash
pnpm push
```

4. Start Zero cache dev server (terminal 1):

```bash
pnpm sync
```

5. Start app dev server on port `7777` (terminal 2):

```bash
pnpm dev
```

6. Open `http://localhost:7777`

## Useful Scripts

- `pnpm dev` - run SvelteKit dev server
- `pnpm sync` - run Zero cache dev server
- `pnpm push` - push Drizzle schema changes to DB
- `pnpm sync-generate` - regenerate Zero schema from Drizzle schema
- `pnpm check` - typecheck with `svelte-check`
- `pnpm lint` - Prettier check
- `pnpm format` - Prettier write
- `pnpm build` - production build

## Data Model (High Level)

Core tables:

- `user`
- `targets`
- `battles`
- `battle_participants`
- `hax`
- `hax_history`
- `ratings`
- `battle_votes`
- `awards`

Schema source: `src/db/schema.ts`

## Development Notes

- App routes are client-rendered (`ssr = false`)
- Admin access is role-based (`syntax`)
- Tasks in this repo are tracked with Dex (`.dex/`)
