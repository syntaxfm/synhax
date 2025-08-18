---
applyTo: '**'
description: 'Technical Steering Document'
---

# Technical Steering Document - Battle Mode Project

## Project Overview

**Battle Mode** is a real-time collaborative coding platform built with:

- **Frontend**: SvelteKit 2.22+ with Svelte 5
- **Backend**: Better Auth 1.3+ for authentication
- **Database**: Drizzle ORM with PostgreSQL
- **Real-time Sync**: Rocicorp Zero for real-time collaboration
- **Styling**: Custom CSS with split-pane components

## Documentation Strategy: Always Use Context7 via MCP

### Primary Documentation Source Priority

When seeking documentation for any library, framework, or tool used in this project, **ALWAYS** use Context7 via MCP tools in the following order:

1. **Context7 MCP** (Primary) - Use `mcp_context7_resolve-library-id` and `mcp_context7_get-library-docs`
2. **Official Documentation** (Secondary) - Only when Context7 lacks coverage
3. **Community Resources** (Tertiary) - Stack Overflow, GitHub issues, etc.

### Context7 Usage Guidelines

#### Step 1: Resolve Library ID

Always start with `mcp_context7_resolve-library-id` to get the correct Context7-compatible library ID:

```
mcp_context7_resolve-library-id(libraryName='[library-name]')
```

#### Step 2: Get Documentation

Use the resolved ID with `mcp_context7_get-library-docs`:

```
mcp_context7_get-library-docs(
  context7CompatibleLibraryID='/org/project',
  topic='[specific-topic]',
  tokens=10000
)
```

### Core Dependencies Documentation Mapping

| Technology        | Context7 Library ID         | Common Topics                                 |
| ----------------- | --------------------------- | --------------------------------------------- |
| **SvelteKit**     | `/sveltejs/kit`             | routing, forms, hooks, layouts, stores        |
| **Svelte 5**      | `/sveltejs/svelte`          | runes, components, reactivity, lifecycle      |
| **Better Auth**   | `/better-auth/better-auth`  | authentication, session management, providers |
| **Drizzle ORM**   | `/drizzle-team/drizzle-orm` | schema, queries, migrations, relations        |
| **Rocicorp Zero** | `/rocicorp/zero`            | sync, schema, real-time updates               |
| **Vite**          | `/vitejs/vite`              | configuration, plugins, build                 |
| **TypeScript**    | `/microsoft/typescript`     | types, interfaces, generics                   |

### Project-Specific Context7 Usage Patterns

#### For Authentication (Better Auth)

```typescript
// When working with auth, always check Context7 for:
// - Session management patterns
// - Provider configuration
// - TypeScript integration
// - SvelteKit integration
```

#### For Real-time Sync (Zero)

```typescript
// Context7 topics to focus on:
// - Schema definition
// - Client setup
// - Svelte integration
// - Real-time queries
// - Conflict resolution
```

#### For Database Operations (Drizzle)

```typescript
// Key Context7 areas:
// - Schema design patterns
// - Query optimization
// - Migration strategies
// - PostgreSQL-specific features
// - TypeScript integration
```

#### For Frontend Architecture (SvelteKit + Svelte 5)

```typescript
// Essential Context7 topics:
// - Runes and reactivity
// - Server-side rendering
// - Form handling
// - Layout patterns
// - State management
```

### Context7 Token Management

- **Default**: 10,000 tokens for comprehensive documentation
- **Specific queries**: 5,000 tokens for targeted information
- **Large topics**: 15,000 tokens for complex subjects like "authentication flows"

### When Context7 is Insufficient

If Context7 doesn't have adequate coverage:

1. **Document the gap**: Note what's missing in project documentation
2. **Use official docs**: Link to official documentation
3. **Update this steering doc**: Add notes about limitations
4. **Consider contributing**: Help improve Context7 coverage

### Integration Points Requiring Special Attention

#### 1. Zero + SvelteKit Integration

- Always check Context7 for latest Zero-Svelte patterns
- Focus on: schema definition, client setup, reactive queries

#### 2. Better Auth + SvelteKit Hooks

- Context7 coverage for: hooks.server.ts patterns, session handling
- Key files: `src/hooks.server.ts`, `src/lib/auth.ts`

#### 3. Drizzle + Zero Schema Sync

- Critical: schema compatibility between Drizzle and Zero
- Files: `src/db/schema.ts`, `src/sync/schema.ts`

#### 4. Real-time State Management

- Context7 for: Svelte 5 runes with Zero sync
- Files: `src/lib/state/BattleState.svelte.ts`, `src/lib/state/UserState.svelte.ts`

### Development Workflow

#### Before Adding New Dependencies

1. Resolve Context7 library ID for the new dependency
2. Review documentation for SvelteKit compatibility
3. Check for existing project integration patterns
4. Document integration approach in this steering doc

#### When Debugging Issues

1. Search Context7 for error patterns specific to the technology
2. Look for troubleshooting guides in Context7 docs
3. Cross-reference with project-specific implementations

#### When Implementing New Features

1. Use Context7 to understand best practices for the feature
2. Look for examples that match project architecture
3. Consider real-time sync implications early in design

### File Structure Considerations

```
src/
├── db/           # Drizzle schema and database setup
├── lib/          # Shared components and utilities
│   ├── auth.ts   # Better Auth configuration
│   └── state/    # Svelte 5 runes for global state
├── routes/       # SvelteKit routing
└── sync/         # Zero real-time sync setup
```

### Context7 Search Strategies

#### For Complex Integrations

- Use broad topics first: "sveltekit integration"
- Then narrow down: "sveltekit hooks authentication"
- Finally specific: "hooks.server.ts session management"

#### For Performance Issues

- Search for: "performance optimization"
- Technology-specific: "sveltekit performance", "zero sync performance"
- Implementation patterns: "efficient queries", "state management"

#### For TypeScript Issues

- General: "typescript integration"
- Specific: "typescript types", "type inference"
- Project-specific: "sveltekit typescript", "drizzle typescript"

### Maintenance and Updates

#### Monthly Review

- Check Context7 for updates to core dependencies
- Review new documentation additions
- Update this steering doc with new patterns

#### When Upgrading Dependencies

1. Check Context7 for migration guides
2. Look for breaking changes documentation
3. Review new features and best practices
4. Update project patterns accordingly

### Context7 Limitations to Watch For

- **Bleeding edge features**: Very new releases may not be covered
- **Niche integrations**: Specific combinations might have limited docs
- **Configuration edge cases**: Complex setups might need official docs

### Emergency Fallback Documentation Sources

If Context7 is unavailable or insufficient:

1. **SvelteKit**: https://kit.svelte.dev/docs
2. **Svelte**: https://svelte.dev/docs
3. **Better Auth**: https://better-auth.com/docs
4. **Drizzle**: https://orm.drizzle.team/docs
5. **Zero**: https://zero.rocicorp.dev/docs

---

**Last Updated**: August 18, 2025  
**Next Review**: September 18, 2025

## Quick Reference Commands

### Resolve Library ID

```
mcp_context7_resolve-library-id(libraryName='[technology-name]')
```

### Get Documentation

```
mcp_context7_get-library-docs(
  context7CompatibleLibraryID='/org/project',
  topic='specific-topic-or-feature'
)
```

### Common Topics by Technology

- **SvelteKit**: routing, forms, hooks, layouts, load functions
- **Svelte 5**: runes, components, lifecycle, events
- **Better Auth**: providers, sessions, middleware, callbacks
- **Drizzle**: schema, queries, migrations, relations, introspection
- **Zero**: sync, real-time, schema, queries, conflict resolution
