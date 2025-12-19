import { createBuilder, defineQueries, defineQuery } from '@rocicorp/zero';
import { schema, type Schema } from '$sync/schema';
import { type } from 'arktype';

/**
 * Battle Mode Synced Queries
 *
 * All read operations for the application defined as synced queries.
 * Context type (ZeroContext) is registered globally via declare module '@rocicorp/zero' in schema.ts
 */

const builder = createBuilder<Schema>(schema);

export const queries = defineQueries({
	// ==================
	// TARGETS
	// ==================
	targets: {
		/** Get all targets with their ratings */
		withRatings: defineQuery(type({ 'limit?': 'number' }), ({ args }) => {
			const q = builder.targets.related('ratings');
			return args.limit ? q.limit(args.limit) : q;
		}),

		/** Get all targets (admin) */
		all: defineQuery(() => builder.targets),

		/** Get a single target by ID */
		byId: defineQuery(type({ id: 'string' }), ({ args }) =>
			builder.targets.where('id', args.id).one()
		)
	},

	// ==================
	// USER
	// ==================
	user: {
		/** Get current user by ID */
		current: defineQuery(({ ctx }) =>
			builder.user.where('id', ctx.userID).one()
		),

		/** Get all users (admin) */
		all: defineQuery(() => builder.user)
	},

	// ==================
	// BATTLES
	// ==================
	battles: {
		/** Get battles by status with target */
		byStatus: defineQuery(
			type({ status: "'PENDING' | 'ACTIVE' | 'COMPLETED'" }),
			({ args }) =>
				builder.battles.where('status', args.status).related('target')
		),

		/** Get a battle by ID with full relations */
		byId: defineQuery(type({ id: 'string' }), ({ args }) =>
			builder.battles
				.where('id', args.id)
				.one()
				.related('referee')
				.related('participants', (q) =>
					q.related('user').related('hax', (h) => h.related('votes'))
				)
				.related('target')
		),

		/** Get a battle by ID with participants (no hax votes - for code page) */
		byIdSimple: defineQuery(type({ id: 'string' }), ({ args }) =>
			builder.battles
				.where('id', args.id)
				.one()
				.related('referee')
				.related('participants', (q) => q.related('user'))
				.related('target')
		),

		/** Get a battle by zero_room_id with full relations */
		byRoomId: defineQuery(type({ zeroRoomId: 'string' }), ({ args }) =>
			builder.battles
				.where('zero_room_id', args.zeroRoomId)
				.one()
				.related('referee')
				.related('participants', (q) =>
					q.related('user').related('hax', (h) => h.related('votes'))
				)
				.related('target')
		),

		/** Get all battles (admin) */
		all: defineQuery(() => builder.battles)
	},

	// ==================
	// BATTLE PARTICIPANTS
	// ==================
	battleParticipants: {
		/** Get user's battle history */
		myHistory: defineQuery(({ ctx }) =>
			builder.battle_participants
				.where('user_id', ctx.userID)
				.related('battle', (b) => b.related('target'))
		)
	},

	// ==================
	// BATTLE VOTES
	// ==================
	battleVotes: {
		/** Get votes for a specific nominee in a battle by the current user */
		myVotesForNominee: defineQuery(
			type({ battleId: 'string', nomineeHaxId: 'string' }),
			({ args, ctx }) =>
				builder.battle_votes.where(({ and, cmp }) =>
					and(
						cmp('battle_id', args.battleId),
						cmp('voter_id', ctx.userID),
						cmp('nominee_hax_id', args.nomineeHaxId)
					)
				)
		)
	},

	// ==================
	// HAX
	// ==================
	hax: {
		/** Get user's hax for a specific battle */
		myForBattle: defineQuery(type({ battleId: 'string' }), ({ args, ctx }) =>
			builder.hax
				.where(({ and, cmp }) =>
					and(cmp('battle_id', args.battleId), cmp('user_id', ctx.userID))
				)
				.one()
		),

		/** Get all hax (admin) */
		all: defineQuery(() => builder.hax)
	},

	// ==================
	// RATINGS
	// ==================
	ratings: {
		/** Get user's rating for a specific target */
		myForTarget: defineQuery(type({ targetId: 'string' }), ({ args, ctx }) =>
			builder.ratings
				.where(({ and, cmp }) =>
					and(cmp('user_id', ctx.userID), cmp('target_id', args.targetId))
				)
				.one()
				.related('user')
				.related('target')
		)
	}
});
