import { createBuilder, defineQueries, defineQuery } from '@rocicorp/zero';
import { schema, type Schema } from '$sync/schema';
import { z } from 'zod';

/**
 * Battle Mode Synced Queries
 *
 * All read operations for the application defined as synced queries.
 * These are validated on the server and can be used with permissions.
 */

const builder = createBuilder<Schema>(schema);

type QueryContext = {
	userID: string;
	userRole: string | undefined;
};

export const queries = defineQueries({
	// ==================
	// TARGETS
	// ==================
	targets: {
		/** Get all targets with their ratings */
		withRatings: defineQuery(
			z.object({ limit: z.number().optional() }),
			({ args }) => {
				const q = builder.targets.related('ratings');
				return args.limit ? q.limit(args.limit) : q;
			}
		),

		/** Get all targets (admin) */
		all: defineQuery(() => builder.targets),

		/** Get a single target by ID */
		byId: defineQuery(z.object({ id: z.string() }), ({ args }) =>
			builder.targets.where('id', args.id).one()
		)
	},

	// ==================
	// USER
	// ==================
	user: {
		/** Get current user by ID */
		current: defineQuery(({ ctx }: { ctx: QueryContext }) =>
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
			z.object({ status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED']) }),
			({ args }) =>
				builder.battles.where('status', args.status).related('target')
		),

		/** Get a battle by ID with full relations */
		byId: defineQuery(z.object({ id: z.string() }), ({ args }) =>
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
		byIdSimple: defineQuery(z.object({ id: z.string() }), ({ args }) =>
			builder.battles
				.where('id', args.id)
				.one()
				.related('referee')
				.related('participants', (q) => q.related('user'))
				.related('target')
		),

		/** Get a battle by zero_room_id with full relations */
		byRoomId: defineQuery(z.object({ zeroRoomId: z.string() }), ({ args }) =>
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
		myHistory: defineQuery(({ ctx }: { ctx: QueryContext }) =>
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
			z.object({ battleId: z.string(), nomineeHaxId: z.string() }),
			({
				args,
				ctx
			}: {
				args: { battleId: string; nomineeHaxId: string };
				ctx: QueryContext;
			}) =>
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
		myForBattle: defineQuery(
			z.object({ battleId: z.string() }),
			({ args, ctx }: { args: { battleId: string }; ctx: QueryContext }) =>
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
		myForTarget: defineQuery(
			z.object({ targetId: z.string() }),
			({ args, ctx }: { args: { targetId: string }; ctx: QueryContext }) =>
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
