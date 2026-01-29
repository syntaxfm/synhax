## Issue Tracking with Dex

**IMPORTANT**: This project uses **Dex** for ALL issue tracking. Do NOT use
markdown TODOs, task lists, or other tracking methods.

### Quick Start

```bash
npx -y @zeeg/dex list
npx -y @zeeg/dex list --all
npx -y @zeeg/dex create -d "Title" --context "Full context..."
npx -y @zeeg/dex create -d "Subtask" --context "Details" --parent <task-id>
npx -y @zeeg/dex complete <task-id> --result "What changed + verification"
```

### Workflow for AI Agents

1. **List open work**: `npx -y @zeeg/dex list`
2. **List all work**: `npx -y @zeeg/dex list --all`
3. **Create tasks** with rich context so work is self-contained
4. **Complete work** with clear results and verification

### Key Rules

- Dex tasks live in `.dex/` and are committed
- No git hooks required
- Dex IDs are ephemeral; do not put them in commits or PRs
- Always use rich `--context` on create and rich `--result` on complete
- Do not create markdown TODO lists or alternate trackers

### GitHub Copilot Integration

If using GitHub Copilot, keep `.github/copilot-instructions.md` aligned with Dex
usage.

### CLI Help

Run `npx -y @zeeg/dex --help` to see all available flags.

### Managing AI-Generated Planning Documents

AI assistants often create planning and design documents during development:

- PLAN.md, IMPLEMENTATION.md, ARCHITECTURE.md
- DESIGN.md, CODEBASE_SUMMARY.md, INTEGRATION_PLAN.md
- TESTING_GUIDE.md, TECHNICAL_DESIGN.md, and similar files

**Best Practice: Use a dedicated directory for these ephemeral files**

**Recommended approach:**

- Create a `history/` directory in the project root
- Store ALL AI-generated planning/design docs in `history/`
- Keep the repository root clean and focused on permanent project files
- Only access `history/` when explicitly asked to review past planning

**Example .gitignore entry (optional):**

```
# AI planning documents (ephemeral)
history/
```

**Benefits:**

- ✅ Clean repository root
- ✅ Clear separation between ephemeral and permanent documentation
- ✅ Easy to exclude from version control if desired
- ✅ Preserves planning history for archeological research
- ✅ Reduces noise when browsing the project

### CLI Help

Run `bd <command> --help` to see all available flags for any command. For
example: `bd create --help` shows `--parent`, `--deps`, `--assignee`, etc.

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ✅ Store AI planning docs in `history/` directory
- ✅ Run `bd <cmd> --help` to discover available flags
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems
- ❌ Do NOT clutter repo root with planning documents

For more details, see README.md and QUICKSTART.md.

## Zero Query & Mutation Architecture

This project uses Zero 0.25+ with **custom query and mutation endpoints** that
provide auth context to every operation.

### Query Context

All queries receive `ctx: { userID, userRole }` from the server:

```ts
// src/routes/api/query/+server.ts
return query.fn({ args, ctx: { userID, userRole } });
```

### Mutation Context

All mutations receive `ctx: { userId, userRole }` from the server:

```ts
// src/routes/api/mutate/+server.ts
return mutator.fn({ args, tx, ctx: { userId, userRole } });
```

### Key Files

- `src/lib/queries.ts` - All query definitions using `defineQueries`
- `src/lib/mutators.ts` - All mutation definitions using `defineMutators`
- `src/routes/api/query/+server.ts` - Query endpoint (passes context)
- `src/routes/api/mutate/+server.ts` - Mutation endpoint (passes context)

### Important Notes

- **DO NOT** use `definePermissions` from Zero - we handle permissions in
  query/mutation definitions via context
- Every query/mutation has access to `userID` and `userRole` via context
- The context is populated from `locals.user` (set by BetterAuth in hooks)
- Anonymous users have `userID: 'anon'` and `userRole: undefined`
- Admin role is `'syntax'`
