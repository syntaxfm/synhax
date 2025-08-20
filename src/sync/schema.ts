import {
	ANYONE_CAN_DO_ANYTHING,
	type PermissionsConfig,
	type Row,
	definePermissions
} from '@rocicorp/zero';

import { schema, type Schema } from './zero-schema.gen';

export { schema, type Schema };

export type User = Row<typeof schema.tables.user>;
export type Target = Row<typeof schema.tables.targets>;
export type Rating = Row<typeof schema.tables.ratings>;
export type Battle = Row<typeof schema.tables.battles>;
export type Participants = Row<typeof schema.tables.battle_participants>;
export type Hax = Row<typeof schema.tables.hax>;
export type Votes = Row<typeof schema.tables.battle_votes>;

type AuthData = {
	// The logged-in user.
	sub: string;
};

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
	return {
		user: ANYONE_CAN_DO_ANYTHING,
		awards: ANYONE_CAN_DO_ANYTHING,
		targets: ANYONE_CAN_DO_ANYTHING,
		ratings: ANYONE_CAN_DO_ANYTHING,
		hax: ANYONE_CAN_DO_ANYTHING,
		battle_votes: ANYONE_CAN_DO_ANYTHING,
		battle_participants: ANYONE_CAN_DO_ANYTHING,
		battles: ANYONE_CAN_DO_ANYTHING
	} satisfies PermissionsConfig<AuthData, Schema>;
});

// TODO only ref can make changes to battle settings
