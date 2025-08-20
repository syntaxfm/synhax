---
applyTo: '**'
description: 'Technical Steering Document'
---

# Technical Steering Document - Battle Mode Project

## Project Overview

**Battle Mode** (SynHax) is a real-time collaborative CSS/HTML coding competition platform built with:

- **Frontend**: SvelteKit 2.30+ with Svelte 5.38+ (using runes)
- **Backend**: Better Auth 1.3+ for authentication with admin plugins
- **Database**: Drizzle ORM 0.44+ with PostgreSQL
- **Real-time Sync**: Rocicorp Zero 0.22+ with zero-svelte 0.3+
- **File Management**: File System Access API for local development
- **Styling**: Custom CSS variables, svelte-splitpanes
- **Code Highlighting**: svelte-highlight with horizon dark theme

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

| Technology                 | Context7 Library ID         | Common Topics                                                       |
| -------------------------- | --------------------------- | ------------------------------------------------------------------- |
| **SvelteKit**              | `/sveltejs/kit`             | routing, forms, hooks, layouts, stores, page state                  |
| **Svelte 5**               | `/sveltejs/svelte`          | runes, components, reactivity, lifecycle, $state, $derived, $effect |
| **Better Auth**            | `/better-auth/better-auth`  | authentication, session management, providers, admin plugin, JWT    |
| **Drizzle ORM**            | `/drizzle-team/drizzle-orm` | schema, queries, migrations, relations, PostgreSQL adapter          |
| **Rocicorp Zero**          | `/rocicorp/zero`            | sync, schema, real-time updates, permissions                        |
| **Zero Svelte**            | `/rocicorp/zero-svelte`     | Query, reactive queries, Svelte integration                         |
| **Vite**                   | `/vitejs/vite`              | configuration, plugins, build                                       |
| **TypeScript**             | `/microsoft/typescript`     | types, interfaces, generics                                         |
| **File System Access API** | N/A (Web API)               | directory handles, file manipulation, permissions                   |

### Project-Specific Context7 Usage Patterns

#### For Authentication (Better Auth)

```typescript
// When working with auth, always check Context7 for:
// - Better Auth 1.3+ with admin plugin integration
// - Session management with SvelteKit hooks
// - JWT token handling with auth API
// - GitHub OAuth provider configuration
// - TypeScript integration with Drizzle adapter
```

#### For Real-time Sync (Zero + Zero-Svelte)

```typescript
// Context7 topics to focus on:
// - Zero-Svelte Query class usage patterns
// - Schema definition with drizzle-zero generation
// - Client setup with JWT authentication
// - Real-time queries with .where() and .related()
// - Permissions configuration with definePermissions
```

#### For Database Operations (Drizzle)

```typescript
// Key Context7 areas:
// - Schema design with enums and relations
// - PostgreSQL-specific features (pgTable, pgEnum)
// - Migration strategies with drizzle-kit
// - Zero schema synchronization (dual schema approach)
// - Complex constraints and indexes
```

#### For Frontend Architecture (SvelteKit + Svelte 5)

```typescript
// Essential Context7 topics:
// - Svelte 5 runes: $state, $derived, $effect
// - Modern reactive patterns with Query classes
// - Component props destructuring with $props()
// - Page state management with $app/state
// - File system integration patterns
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

#### 2. Better Auth + SvelteKit Integration

- Context7 coverage for: hooks.server.ts patterns, session handling, JWT token management
- Key files: `src/hooks.server.ts`, `src/lib/auth.ts`, `src/lib/auth-client.ts`
- Admin plugin usage and role-based access control

#### 3. Drizzle + Zero Dual Schema Management

- Critical: schema compatibility between Drizzle and Zero
- Files: `src/db/schema.ts`, `src/sync/schema.ts`, `src/sync/zero-schema.gen.ts`
- Auto-generation workflow with drizzle-zero CLI

#### 4. Svelte 5 Runes + Zero-Svelte Integration

- Context7 for: Modern reactive patterns with Query classes
- Files: `src/lib/state/FileState.svelte.ts`, component patterns throughout routes
- $state, $derived, $effect usage with real-time data

#### 5. File System Access API Integration

- Local development workflow with directory handles
- Real-time file watching and sync to Zero database
- File persistence with IndexedDB for handle storage

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
│   ├── auth.ts           # Better Auth server configuration
│   ├── auth-client.ts    # Better Auth client (Svelte)
│   ├── battle_mode/      # Battle-specific components
│   ├── constants/        # App constants and templates
│   ├── state/            # Svelte 5 runes for global state
│   ├── targets/          # Target management components
│   ├── ui/               # Reusable UI components
│   └── user/             # User utilities and helpers
├── routes/       # SvelteKit routing with nested battle structure
├── sync/         # Zero real-time sync setup
│   ├── client.ts         # Zero client configuration
│   ├── schema.ts         # Zero schema with permissions
│   └── zero-schema.gen.ts # Auto-generated from Drizzle
└── utils/        # Application utilities (filesystem, formatting, etc.)
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
