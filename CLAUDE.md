# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SynHax (battle_mode) is a real-time competitive CSS/HTML coding battle platform built like a video game. Users compete in timed battles to replicate UI "targets" while others watch live. The app includes roles (competitors, viewers, referees), voting systems, and a Mario Party-like award ceremony.

## Tech Stack

- **SvelteKit** with Svelte 5 (using experimental async compiler option)
- **Zero Sync** (`@rocicorp/zero`) - Real-time data synchronization for live battle updates
- **Postgres** with Drizzle ORM
- **Better Auth** - Authentication with GitHub OAuth
- **Web Awesome** - UI component library
- **Cloudflare** - Deployment target (adapter-cloudflare)
- **Sentry** - Error tracking and performance monitoring

## Key Architecture Patterns

### Dual Database Layer

The project uses **two separate but synchronized data layers**:

1. **Postgres (via Drizzle)** - Source of truth
   - Located in `src/db/schema.ts`
   - Accessed via `src/db/index.ts`
   - Connection string: `ZERO_UPSTREAM_DB` env var

2. **Zero Sync Schema** - Real-time client synchronization
   - Schema definition: `src/sync/schema.ts`
   - Generated types: `src/sync/zero-schema.gen.ts` (auto-generated, don't edit)
   - Client instance: `src/sync/client.ts`
   - Permissions: Currently set to `ANYONE_CAN_DO_ANYTHING` (see TODO in schema.ts)

**Important**: When modifying data structures, you must update **both** schemas and regenerate Zero schema.

### Authentication Flow

Better Auth handles GitHub OAuth with roles stored in the `user` table:
- `syntax` - Admin role (can create targets)
- `normal` - Regular users
- `anon` - Not logged in (can watch battles without voting)

Session is available in `event.locals.session` and `event.locals.user` via hooks.server.ts.

### Battle System

Battles have distinct roles and states:
- **Referee**: Creates battle (stored as `referee_id` on battle), controls timing, can add overtime, reveals winners
- **Battlers**: Active competitors writing code (stored in `battle_participants` with status tracking)
- **Viewers**: Watch live, can vote if logged in (also in `battle_participants`)

**Battle states**: `PENDING` → `ACTIVE` → `COMPLETED`
**Participant states**: `PENDING` → `READY` → `ACTIVE` → `FINISHED` or `DROPPED`

Each battle has a unique `zero_room_id` for real-time sync isolation.

**Award types** (voted on by viewers after battle):
- `MOST_ACCURATE` - Closest to target
- `REAL_WORLD` - Most production-ready code
- `BEST_FEEL` - Best overall vibe/aesthetic

### Route Structure

- `(blank)/` - Minimal layout routes (e.g., breakout view)
- `(style)/` - Main styled layout group
  - `(menu)/` - Menu screens (dashboard, settings, history)
  - `(app)/battle/` - Battle screens (code, watch, lobby, recap, ref)
  - `(admin)/` - Admin-only routes (targets, users, battles management)

### File System API Integration

The app uses the File System Access API to allow users to edit HTML/CSS files locally with auto-save to the database:
- **FileState** (`src/lib/state/FileState.svelte.ts`) - Manages directory handles and file watching
- **Workflow**: Users grant access to `~/.synhax` directory → app creates/loads project folders → files (index.html, styles.css) are watched for changes → changes auto-sync to database via Zero
- **Persistence**: Directory handles stored in IndexedDB for session persistence
- **Validation**: `src/utils/filesystem.ts` ensures required files (index.html, styles.css) exist

## Common Development Commands

### Development
```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm check            # Type-check with svelte-check
pnpm check:watch      # Type-check in watch mode
```

### Code Quality
```bash
pnpm format           # Format code with Prettier
pnpm lint             # Check formatting
```

### Database Operations
```bash
pnpm push             # Push Drizzle schema changes to Postgres
pnpm studio           # Open Drizzle Studio (database GUI)
pnpm sync-generate    # Generate Zero schema from Drizzle schema
pnpm auth-generate    # Generate Better Auth client types
pnpm sync-permissions # Deploy Zero permissions
```

**Workflow after schema changes:**
1. Update `src/db/schema.ts` (Drizzle schema)
2. Run `pnpm push` to update database
3. Update `src/sync/schema.ts` if real-time sync needed
4. Run `pnpm sync-generate` to regenerate Zero types

## Environment Variables

Required in `.env` (not committed):

```bash
# Database
ZERO_UPSTREAM_DB=postgres://user:pass@host:5432/dbname

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# Sentry (optional)
SENTRY_DSN=...
PUBLIC_SENTRY_DSN=...

# Zero Sync Server
PUBLIC_SERVER=your_zero_server_url
```

## Important Implementation Notes

### When Working with Real-time Features

- Use Zero client (`z` from `$sync/client.ts`) for queries in components
- Battle participants, hax submissions, and votes sync in real-time
- Each battle uses a unique Zero room for isolation

### Path Aliases

- `$lib` → `src/lib`
- `$routes` → `src/routes`
- `$sync` → `src/sync`
- `$db` → `src/db`
- `$utils` → `src/utils`
- `$const` → `src/constants`

### Auth Guards

Admin routes check for `session.user.role === 'syntax'` in +layout.server.ts files.

### Unique Constraints & Business Rules

- Users can only have one hax submission per battle
- Users can only rate a target once
- Votes are per (battle, voter, award_type, nominee)
- Each battle has exactly one referee
- Awards are unique per (battle, award_type)

### Sentry Integration

Error tracking is initialized in `instrumentation.server.ts`. Server errors are captured via `handleError` in hooks.server.ts. User context is automatically set from session.

## Testing Considerations

When testing battles:
- Create target first (admin-only)
- Initialize battle with target_id
- Join as battler through lobby
- Referee controls battle flow
- Real-time sync requires Zero server running

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
