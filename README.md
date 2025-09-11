# SynHax

A css / html battles app (maybe eventually frameworks and javascript too). Users will compete to find elegant solutions to UI problems called "targets" users can submit their solutions called "hacks" either as a one off submission OR as apart of a competitive "battle". Battles can be observed in real time and interacted with as users are coding. It is designed to be like a video game. something like mario party. entertaining

1. users logged in from github

2. users have profile that contains a theme selector

3. targets. targets are css and html competitions that have a "target" which is either, html/css code, and image, or a video showing a ui element that the user will try to replicate. targets may reference battles (see below) or individual (submissions)

4. battles. battles are a timed competition where multiple users will face off to complete a target in one of while being first to submit (no edits allowed after submission) aka time trial, or how far can you get in under a certain amount of time. that time can be configured and there would be an option to give everyone more time if needed. the person who would control that would be the "referee".

5. a battle can be created by a user. one user signed up for a battle will be the referee.

6. users can be competitors, viewers, OR the referee. the user who creates a battle will be the referee, only the referee and can upgrade a viewers in the lobby to competitors.

7. for now only users that have the role of "syntax" can create targets. and for a battle to be created, a target must exist.

8. hax. hax are user submissions for a target. they can be completed on a user's own time while taking as much time as wanted, or they can be done via a battle where competitors compete to finish a hack based on time trial complete in under a certain amount of time.

9. rating. ratings are when a user reviews a target. a user can only rate a target once. it can be done in the post hack submission OR post battle screen.

10. judging. after a battle has been finished registered users can vote on users anonymously after voting they can lock in their vote to see who wrote what. after locking in, you CANNOT change. The syntax team can then use these votes in our video edit to show the winner.

11. reveal. referee can "reveal" winners in a mario party like ceremony where awards are distributed. the reveal will only happen when the ref clicks reveal on the recap page. will initiate a screen take over for all battlers, viewers, referee

## Screens

### / - Start Screen

### /battle/code/id/ Battle - Battler

- WHEN user is battler for specific battle
- SEE own code and executed node
- CAN interact rendered app
- CAN submit solution

### /battle/ref/id/ Battle - Referee

- WHEN user is referee
- SEE code and executed code of all users working
- SEE target inspo
- WHEN public
- SEE and copy public url
- CAN make battle public
- WHEN battle is over
- CAN add overtime
- CAN complete battle

- WHEN user is NOT referee

- CANNOT access

### /battle/watch/id/ Battle - Audience

- WHEN battle is public
- SEE code and executed code of all users working
- WHEN logged in, CAN vote once per category per battle

### /dashboard/

- SEE list of targets with name, inspo image
- WHEN target selected
- SEE Number of hacks completed, completion %, [TARGET_ATTRIBUTES]

### /battle/id/recap/ - Battle Recap

- SEE Awards "accuracy", "real coder", "performance", "vibe"
- SEE each user's submission
- CAN Download final code
- CAN Click to open UIs to try
- CAN Vote Results show in realtime
- CAN rate [TARGET_ATTRIBUTES]
- FOR Time Trial -> SEE completed time

### /settings/

- WHEN user is ID
- CAN Change Theme
- CAN Logout
- CAN change ~~character~~
- WHEN user is NOT ID
- CANNOT access

### /profile/ (PHW)

- SEE History of battles
- SEE History of Hax
- SEE Awards _PHW_
- SEE Friends \_PHW

### /battle/init/

- AESTHETIC from Pokemon battle / smash bros battle
- AUTO creates a unique ID for battle
- AUTO sets referee role to user
- CAN set all [BATTLE_SETTINGS]

### /battle/lobby/id/

- AESTHETIC from Pokemon battle / smash bros battle
- AUTO creates a unique ID for battle
- AUTO sets referee role to user
- CAN set all [BATTLE_SETTINGS]

### /target/id

- MUST Upload TARGET_INSPO
- MUST Upload Image of Inspo (can be automattic in the future)
- MUST Name Target

### /admin _PHW_

- Big tables of users, battles, hacks, targets ect, no functionality needed for hackweek

## App Flow

### ANON

-> /
-> /battle/watch/id/

### USER

-> /dashboard
--> /battle/init
--> /settings
--> /battle/lobby/id
--> /target/init
--> /battle/id/recap/
--> /profile (PHW)
-> /battle/watch/id/

## Tech Choices

- SvelteKit
- Svelte 5
- Zero Sync for realtime, syncing data
- Postgres
- Drizzle - orm for postgres
- Github Oauth
- Web Awesome for UI elements
- CSS Variables for theming and all CSS
- Better Auth with Github OAuth via Drizzle

- - With admin tools, access controls with roles

- File System API for editing files locally

RENDER

- Rendered preview of users hax code

## Tables

all have basic created_at, updated_at, id

-USER-

- user_id: string - github id
- roles: [USER_ROLES]
- awards: [-AWARD-]
- avatar: string
- bio: string
- theme: string (based on highlightjs themes)

USER_ROLES

- anon - NON LOGGED IN. anon users can watch battles without voting
- syntax - for syntax team members aka super admins
- normal - regular users

-AWARD-

- user_id: -USER- | null
- battle_id: -BATTLE-
- award_type: USER_AWARD
  unique (battle_id, award_type)

USER_AWARD(PHW)

- accurate
- real world
- best overall

-USER_RELATIONSHIPS-

- user_id: -USER-
- related_user_id: -USER-
- type: [FOLLOW | FRIEND]
- created_at: date
  unique(user_id, related_user_id, type) so no dupes
  check(user_id <> related_user_id) so no self-links

-BATTLE-

- date: date
- referee: -USER-
- settings: BATTLE_SETTINGS
- target_id: -TARGET-
- status: BATTLE_STATUS
- public_token: string

BATTLE_SETTINGS

- Type: [TIME_TRIAL, TIMED_MATCH]
- Total Time: Number
- Overtime? Boolean | null
- Visibility: [PUBLIC | PRIVATE]
- rating: number

BATTLE_STATUS
[PENDING, ACTIVE, COMPLETED]

-BATTLE_PARTICIPANTS-

- battle_id: -BATTLE-
- user_id: -USER-
- role: [BATTLER | VIEWER]
- status: [PENDING | READY | ACTIVE | DROPPED | FINISHED]   # replaces is_ready
- joined_at: date
- last_seen_at: date
- finished_at: date | null
  constraints:
- unique(battle_id, user_id)             # user has one participation row per battle
- index(battle_id, role)
- index(battle_id, status)

-BATTLE_VOTES-

battle_id: -BATTLE-
voter_id: -USER-
nominee_hax_id: -HAX-
award_type: USER_AWARD
unique(battle_id, voter_id, award_type)
rule(nominee_hax_id must belong to battle_id)

-HAX-

- target_id: -TARGET-
- battle_id: -BATTLE- | null
- user_id: -USER-
- html: string
- css: string
- type: BATTLE | SOLO

-TARGET-

- name: string
- image: string
- type: [TARGET_TYPE]
- inpso: string - url to image/video (html inspo to think more on later. find host for video/images )
- archived_at: date

TARGET_TYPE

- code (css & html)
- image
- video

TARGET_ATTRIBUTES

- difficulty
- creativity
- fun
- coolness

-RATING-

- user_id: -USER-
- target_id: -TARGET-
- difficulty: number
- creativity: number
- fun: number
- coolness: number

### Future Ideas

#### Battles

- Send others users bombs or something that modifies their code to fuck with them while they are coding

- Friending System

- Individual submissions, hackweek version include ONLY battles a means of submitting

## Environment Variables

- `ZERO_UPSTREAM_DB`: Postgres connection string used for both application runtime and Drizzle migrations. Replaces the former `DB_URL` variable (now deprecated).

### Setup

1. Local dev: add to `.env` (not committed):
   ```bash
   ZERO_UPSTREAM_DB=postgres://user:pass@host:5432/dbname
   ```
2. SvelteKit server code imports it via `$env/static/private` (see `src/db/index.ts`). Restart the dev server after changes.
3. Cloudflare Workers: store as a secret (recommended):
   ```bash
   wrangler secret put ZERO_UPSTREAM_DB
   ```
4. Drizzle CLI + migrations use `process.env.ZERO_UPSTREAM_DB` (see `drizzle.config.ts`).

Remove any legacy `DB_URL` definitions from local `.env` and Cloudflare secrets to avoid confusion. Only `ZERO_UPSTREAM_DB` is now used.

## Sentry

Error and performance monitoring is integrated with Sentry.

### Config Files

- `sentry.server.config.ts`: Initializes Sentry for server/runtime using `SENTRY_DSN`.
- `sentry.client.config.ts`: Initializes Sentry in the browser using `PUBLIC_SENTRY_DSN`.

These are auto-loaded by the Sentry SDK (import side effects) when bundled.

### Env Vars

Add to `.env` (do not commit real values):

```
SENTRY_DSN=... # private
PUBLIC_SENTRY_DSN=... # optional public (omit if not capturing browser errors)
```

### Source Maps (optional CI)

Provide the following in your CI environment to enable source map upload via the Vite plugin:

```
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORG=scott-tolinski-projects
SENTRY_PROJECT=javascript-svelte
```

The plugin is inert locally unless those vars are set.

### Server Error Capture

Unhandled server errors are captured in `src/hooks.server.ts` via `handleError`.

### Testing

Trigger a test error in a route load/function to verify it appears in Sentry.

### Adjust Sampling

Modify `tracesSampleRate` / `profilesSampleRate` in the config files as needed for production.
