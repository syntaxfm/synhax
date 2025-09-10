# AGENTS.md

When connected to the svelte-llm MCP server, you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools

### 1. list_sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get_documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list_sections tool, you MUST analyze the returned documentation sections and then use the get_documentation tool to fetch ALL documentation sections that are relevant for the users task.

- Build/dev: `pnpm install`; run `pnpm dev`; deploy build `pnpm build`; preview `pnpm preview`
- Typecheck: `pnpm check`; watch `pnpm check:watch`
- Lint/format: `pnpm lint` (Prettier check) and `pnpm format` (write)
- Data/Zero tools: `pnpm push`, `pnpm studio`, `pnpm sync-generate`, `pnpm sync`, `pnpm sync-permissions`
- Tests: none configured; if adding Vitest, single test via `pnpm vitest path/to/file.test.ts -t "name"`
- Prettier: tabs, single quotes, width 100, no trailing commas; Svelte via `prettier-plugin-svelte`
- Prettier ignore: lockfiles and `/static/` (see `.prettierignore`)
- Imports: prefer SvelteKit aliases `$lib`, `$routes`, `$sync`, `$db`, `$utils`, `$const`
- Type-only imports: use `import type` for types; export public types with `export type`
- TS config: strict mode; `moduleResolution: bundler`; `allowJs` + `checkJs`; avoid implicit `any`
- Naming: PascalCase for components/types; camelCase for vars/functions; UPPER_SNAKE_CASE for constants; keep helpers like `to_snake_case`
- Svelte: Svelte 5; use `<script lang="ts">`; keep props/stores typed; avoid runtime-only types in markup
- Error handling (endpoints): return `json(data, { status })`; guard inputs; wrap external I/O in try/catch
- Error handling (pages/actions): prefer `throw error(status, message)` or `fail(status, data)` as appropriate
- Aliases/config live in `svelte.config.js`; do not hardcode relative paths when an alias exists
- File layout: shared UI in `src/lib/`; routes in `src/routes/` following SvelteKit conventions
- Generated code: do not edit `src/sync/zero-schema.gen.ts`; regenerate via `pnpm sync-generate`
- Commit hygiene: run `pnpm format` and `pnpm check` before PRs
- Cursor/Copilot: no repo-specific rules found; if added later, follow them over this file
- Keep edits minimal and consistent with existing patterns
