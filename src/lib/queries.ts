import { defineQueries, defineQuery } from '@rocicorp/zero';
import { zql } from '$sync/zero-schema.gen';
import { type } from 'arktype';

/**
 * Battle Mode Synced Queries
 *
 * All read operations for the application defined as synced queries.
 * Context type (ZeroContext) is registered globally via declare module '@rocicorp/zero' in schema.ts
 */

export const queries = defineQueries({
	// ==================
	// TARGETS
	// ==================
	targets: {
		/** Get all targets with their ratings */
		withRatings: defineQuery(type({ 'limit?': 'number' }), ({ args }) => {
			const q = zql.targets.related('ratings');
			return args.limit ? q.limit(args.limit) : q;
		}),

		/** Get all targets (admin) */
		all: defineQuery(({ ctx }) =>
			ctx.userRole === 'syntax'
				? zql.targets
				: zql.targets.where('id', '__admin_only__')
		),

		/** Get a single target by ID */
		byId: defineQuery(type({ id: 'string' }), ({ args }) =>
			zql.targets.where('id', args.id).one()
		)
	},

	// ==================
	// USER
	// ==================
	user: {
		/** Get current user by ID */
		current: defineQuery(({ ctx }) => {
			return zql.user.where('id', ctx.userID).one();
		}),

		/** Get all users (admin) */
		all: defineQuery(({ ctx }) =>
			ctx.userRole === 'syntax'
				? zql.user
				: zql.user.where('id', '__admin_only__')
		),

		/** Get a single user by ID with their battles and hax (admin) */
		byId: defineQuery(type({ id: 'string' }), ({ args, ctx }) =>
			ctx.userRole === 'syntax'
				? zql.user
						.where('id', args.id)
						.one()
						.related('participants', (q) =>
							q.related('battle', (b) => b.related('target'))
						)
						.related('hax', (h) => h.related('target').related('battle'))
				: zql.user.where('id', '__admin_only__').one()
		)
	},

	// ==================
	// BATTLES
	// ==================
	battles: {
		/** Get battles by status with target */
		byStatus: defineQuery(
			type({ status: "'PENDING' | 'READY' | 'ACTIVE' | 'COMPLETED'" }),
			({ args }) => zql.battles.where('status', args.status).related('target')
		),

		/** Get a battle by ID with full relations */
		byId: defineQuery(type({ id: 'string' }), ({ args }) =>
			zql.battles
				.where('id', args.id)
				.one()
				.related('referee')
				.related('participants', (q) =>
					q.related('user').related('hax', (h) => h.related('votes'))
				)
				.related('target')
		),

		/** Get a battle by ID with participants and their hax (for code page with live scores) */
		byIdSimple: defineQuery(type({ id: 'string' }), ({ args }) =>
			zql.battles
				.where('id', args.id)
				.one()
				.related('referee')
				.related('participants', (q) => q.related('user').related('hax'))
				.related('target')
		),

		/** Get a battle by zero_room_id with full relations */
		byRoomId: defineQuery(type({ zeroRoomId: 'string' }), ({ args }) =>
			zql.battles
				.where('zero_room_id', args.zeroRoomId)
				.one()
				.related('referee')
				.related('participants', (q) =>
					q.related('user').related('hax', (h) => h.related('votes'))
				)
				.related('target')
		),

		/** Get all battles (admin) */
		all: defineQuery(({ ctx }) =>
			ctx.userRole === 'syntax'
				? zql.battles
				: zql.battles.where('id', '__admin_only__')
		),

		/** Get all battles with target and participants (admin) */
		allWithRelations: defineQuery(({ ctx }) =>
			ctx.userRole === 'syntax'
				? zql.battles
						.related('target')
						.related('participants', (q) => q.related('user'))
				: zql.battles.where('id', '__admin_only__')
		)
	},

	// ==================
	// BATTLE PARTICIPANTS
	// ==================
	battleParticipants: {
		/** Get user's battle history */
		myHistory: defineQuery(({ ctx }) =>
			zql.battle_participants
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
				zql.battle_votes.where(({ and, cmp }) =>
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
			zql.hax
				.where(({ and, cmp }) =>
					and(cmp('battle_id', args.battleId), cmp('user_id', ctx.userID))
				)
				.one()
		),

		/** Get all hax (admin) */
		all: defineQuery(({ ctx }) =>
			ctx.userRole === 'syntax'
				? zql.hax
				: zql.hax.where('id', '__admin_only__')
		)
	},

	// ==================
	// HAX HISTORY (for playback/replay)
	// ==================
	haxHistory: {
		/** Get all history entries for a hax, ordered by sequence for playback */
		forHax: defineQuery(type({ haxId: 'string' }), ({ args }) =>
			zql.hax_history.where('hax_id', args.haxId).orderBy('sequence', 'asc')
		)
	},

	// ==================
	// RATINGS
	// ==================
	ratings: {
		/** Get user's rating for a specific target */
		myForTarget: defineQuery(type({ targetId: 'string' }), ({ args, ctx }) =>
			zql.ratings
				.where(({ and, cmp }) =>
					and(cmp('user_id', ctx.userID), cmp('target_id', args.targetId))
				)
				.one()
				.related('user')
				.related('target')
		)
	}
});
