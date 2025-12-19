import { type Row, type Schema as ZeroSchema } from '@rocicorp/zero';

import { schema as genSchema } from './zero-schema.gen';

export const schema = {
	...genSchema,
	enableLegacyQueries: false
} as const satisfies ZeroSchema;

export type Schema = typeof schema;

export type User = Row<typeof schema.tables.user>;
export type Target = Row<typeof schema.tables.targets>;
export type Rating = Row<typeof schema.tables.ratings>;
export type Battle = Row<typeof schema.tables.battles>;
export type Participants = Row<typeof schema.tables.battle_participants>;
export type Hax = Row<typeof schema.tables.hax>;
export type Votes = Row<typeof schema.tables.battle_votes>;

/**
 * Zero Context - passed to queries and mutators for auth/permissions
 * On client: populated from JWT
 * On server: populated from locals.user in the API endpoints
 */
export type ZeroContext = {
	userID: string;
	userRole: string | undefined;
};

// Register context type with Zero
declare module '@rocicorp/zero' {
	interface DefaultTypes {
		context: ZeroContext;
	}
}
