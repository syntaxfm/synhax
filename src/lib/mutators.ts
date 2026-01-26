import { defineMutators, defineMutator } from '@rocicorp/zero';
import { type } from 'arktype';
import { type ZeroContext } from '$sync/schema';
import { zql } from '$sync/zero-schema.gen';
import {
	battle_status_enum,
	visibility_enum,
	battle_type_enum,
	win_condition_enum,
	participant_status_enum,
	hax_type_enum,
	user_award_enum,
	target_type_enum
} from '$db/schema';

/**
 * Battle Mode Mutators
 *
 * All write operations for the application.
 * These run on both client (optimistically) and server (authoritatively).
 *
 * Context type (ZeroContext) is registered globally via declare module '@rocicorp/zero' in schema.ts
 */

// Create ArkType enums from Drizzle pgEnum values
const battleStatusEnum = type.enumerated(...battle_status_enum.enumValues);
const visibilityEnum = type.enumerated(...visibility_enum.enumValues);
const battleTypeEnum = type.enumerated(...battle_type_enum.enumValues);
const winConditionEnum = type.enumerated(...win_condition_enum.enumValues);
const participantStatusEnum = type.enumerated(
	...participant_status_enum.enumValues
);
const haxTypeEnum = type.enumerated(...hax_type_enum.enumValues);
const userAwardEnum = type.enumerated(...user_award_enum.enumValues);
const targetTypeEnum = type.enumerated(...target_type_enum.enumValues);

const AUTH_ERROR = 'Authentication required';

function assertAuthenticated(ctx: ZeroContext) {
	if (!ctx.userID || ctx.userID === 'anon') {
		throw new Error(AUTH_ERROR);
	}
}

function isAdmin(ctx: ZeroContext) {
	return ctx.userRole === 'syntax';
}

type RunTx = { run: (...args: any[]) => Promise<any> };

async function runOne(tx: RunTx, query: unknown) {
	const result = await tx.run(query);
	return Array.isArray(result) ? result[0] : result;
}

async function getBattle(tx: RunTx, battleId: string) {
	return runOne(tx, zql.battles.where('id', battleId).one());
}

async function getParticipant(tx: RunTx, participantId: string) {
	return runOne(tx, zql.battle_participants.where('id', participantId).one());
}

async function getHax(tx: RunTx, haxId: string) {
	return runOne(tx, zql.hax.where('id', haxId).one());
}

async function getVote(tx: RunTx, voteId: string) {
	return runOne(tx, zql.battle_votes.where('id', voteId).one());
}

async function getRating(tx: RunTx, ratingId: string) {
	return runOne(tx, zql.ratings.where('id', ratingId).one());
}

async function assertBattleOwner(
	tx: RunTx,
	ctx: ZeroContext,
	update: {
		id: string;
		winner_hax_id?: string | null;
		status?: string | null;
	}
) {
	const battle = (await getBattle(tx, update.id)) as {
		referee_id?: string;
		win_condition?: string | null;
	} | null;
	if (!battle?.referee_id) {
		throw new Error('Battle not found');
	}
	if (isAdmin(ctx) || battle.referee_id === ctx.userID) {
		return;
	}
	if (
		battle.win_condition === 'FIRST_TO_PERFECT' &&
		update.status === 'COMPLETED' &&
		update.winner_hax_id
	) {
		const hax = (await getHax(tx, update.winner_hax_id)) as {
			user_id?: string;
		} | null;
		if (hax?.user_id === ctx.userID) {
			return;
		}
	}
	throw new Error('Only the referee can update this battle');
}

async function assertParticipantOwner(
	tx: RunTx,
	ctx: ZeroContext,
	participantId: string
) {
	const participant = (await getParticipant(tx, participantId)) as {
		user_id?: string;
	} | null;
	if (!participant?.user_id) {
		throw new Error('Participant not found');
	}
	if (!isAdmin(ctx) && participant.user_id !== ctx.userID) {
		throw new Error('Participants can only be updated for yourself');
	}
}

async function assertHaxOwner(tx: RunTx, ctx: ZeroContext, haxId: string) {
	const hax = (await getHax(tx, haxId)) as { user_id?: string } | null;
	if (!hax?.user_id) {
		throw new Error('Hax not found');
	}
	if (!isAdmin(ctx) && hax.user_id !== ctx.userID) {
		throw new Error('Hax can only be updated for yourself');
	}
}

async function assertVoteOwner(tx: RunTx, ctx: ZeroContext, voteId: string) {
	const vote = (await getVote(tx, voteId)) as { voter_id?: string } | null;
	if (!vote?.voter_id) {
		return null;
	}
	if (!isAdmin(ctx) && vote.voter_id !== ctx.userID) {
		throw new Error('Votes can only be submitted for yourself');
	}
	return vote;
}

async function assertRatingOwner(
	tx: RunTx,
	ctx: ZeroContext,
	ratingId: string
) {
	const rating = (await getRating(tx, ratingId)) as { user_id?: string } | null;
	if (!rating?.user_id) {
		return null;
	}
	if (!isAdmin(ctx) && rating.user_id !== ctx.userID) {
		throw new Error('Ratings can only be submitted for yourself');
	}
	return rating;
}

export const mutators = defineMutators({
	// ==================
	// BATTLES
	// ==================
	battles: {
		insert: defineMutator(
			type({
				id: 'string',
				'name?': 'string',
				target_id: 'string',
				zero_room_id: 'string',
				referee_id: 'string',
				type: battleTypeEnum,
				'win_condition?': winConditionEnum,
				total_time_seconds: 'number',
				'overtime_seconds?': 'number',
				'status?': battleStatusEnum,
				'visibility?': visibilityEnum,
				'allow_time_extension?': 'boolean',
				'starts_at?': 'number',
				'ends_at?': 'number'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				if (!isAdmin(ctx) && args.referee_id !== ctx.userID) {
					throw new Error('Referee must match the authenticated user');
				}
				const refereeId = isAdmin(ctx) ? args.referee_id : ctx.userID;
				const now = Date.now();
				await tx.mutate.battles.insert({
					id: args.id,
					name: args.name,
					target_id: args.target_id,
					zero_room_id: args.zero_room_id,
					referee_id: refereeId,
					type: args.type,
					win_condition: args.win_condition ?? 'FIRST_TO_PERFECT',
					total_time_seconds: args.total_time_seconds,
					overtime_seconds: args.overtime_seconds,
					status: args.status ?? 'PENDING',
					visibility: args.visibility ?? 'PRIVATE',
					starts_at: args.starts_at,
					ends_at: args.ends_at,
					date: now,
					allow_time_extension: args.allow_time_extension ?? true,
					created_at: now,
					updated_at: now
				});
			}
		),
		update: defineMutator(
			type({
				id: 'string',
				'name?': 'string',
				'status?': battleStatusEnum,
				'visibility?': visibilityEnum,
				'type?': battleTypeEnum,
				'win_condition?': winConditionEnum,
				'total_time_seconds?': 'number',
				'overtime_seconds?': 'number',
				'starts_at?': 'number | null',
				'ends_at?': 'number | null',
				'allow_time_extension?': 'boolean',
				'revealed_at?': 'number | null',
				'winner_hax_id?': 'string | null'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				await assertBattleOwner(tx, ctx, {
					id: args.id,
					status: args.status,
					winner_hax_id: args.winner_hax_id
				});
				const winnerProvided = Object.prototype.hasOwnProperty.call(
					args,
					'winner_hax_id'
				);
				if (winnerProvided || args.status === 'COMPLETED') {
					const battle = (await getBattle(tx, args.id)) as {
						winner_hax_id?: string | null;
						status?: string | null;
					} | null;
					if (!battle) {
						throw new Error('Battle not found');
					}
					if (battle.winner_hax_id) {
						if (!winnerProvided) {
							throw new Error('Battle winner is already set');
						}
						if (args.winner_hax_id !== battle.winner_hax_id) {
							throw new Error('Battle winner is already set');
						}
					}
				}
				await tx.mutate.battles.update({
					id: args.id,
					name: args.name,
					status: args.status,
					visibility: args.visibility,
					type: args.type,
					win_condition: args.win_condition,
					total_time_seconds: args.total_time_seconds,
					overtime_seconds: args.overtime_seconds,
					starts_at: args.starts_at,
					ends_at: args.ends_at,
					allow_time_extension: args.allow_time_extension,
					revealed_at: args.revealed_at,
					winner_hax_id: args.winner_hax_id,
					updated_at: Date.now()
				});
			}
		)
	},

	// ==================
	// BATTLE PARTICIPANTS
	// ==================
	battle_participants: {
		insert: defineMutator(
			type({
				id: 'string',
				battle_id: 'string',
				user_id: 'string',
				'status?': participantStatusEnum,
				'display_order?': 'number'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				if (!isAdmin(ctx) && args.user_id !== ctx.userID) {
					throw new Error('Participants can only be created for yourself');
				}
				const participants = (await tx.run(
					zql.battle_participants.where('battle_id', args.battle_id)
				)) as { id?: string; status?: string | null }[];
				const activeCount = Array.isArray(participants)
					? participants.filter(
							(participant) =>
								participant.status !== 'DROPPED' && participant.id !== args.id
						).length
					: 0;
				if (activeCount >= 2) {
					throw new Error('Battle already has two participants');
				}
				const userId = isAdmin(ctx) ? args.user_id : ctx.userID;
				const now = Date.now();
				await tx.mutate.battle_participants.insert({
					id: args.id,
					battle_id: args.battle_id,
					user_id: userId,
					status: args.status ?? 'PENDING',
					display_order: args.display_order,
					joined_at: now,
					created_at: now,
					updated_at: now
				});
			}
		),
		update: defineMutator(
			type({
				id: 'string',
				'status?': participantStatusEnum,
				'display_order?': 'number',
				'finished_at?': 'number'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				await assertParticipantOwner(tx, ctx, args.id);
				await tx.mutate.battle_participants.update({
					id: args.id,
					status: args.status,
					display_order: args.display_order,
					finished_at: args.finished_at,
					updated_at: Date.now()
				});
			}
		),
		upsert: defineMutator(
			type({
				id: 'string',
				battle_id: 'string',
				user_id: 'string',
				'status?': participantStatusEnum,
				'display_order?': 'number'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				const existing = (await getParticipant(tx, args.id)) as {
					joined_at?: number | null;
					created_at?: number | null;
				} | null;
				if (existing) {
					await assertParticipantOwner(tx, ctx, args.id);
				}
				if (!isAdmin(ctx) && args.user_id !== ctx.userID) {
					throw new Error('Participants can only be updated for yourself');
				}
				const userId = isAdmin(ctx) ? args.user_id : ctx.userID;
				const now = Date.now();
				const joinedAt = existing?.joined_at ?? now;
				const createdAt = existing?.created_at ?? now;
				await tx.mutate.battle_participants.upsert({
					id: args.id,
					battle_id: args.battle_id,
					user_id: userId,
					status: args.status ?? 'PENDING',
					display_order: args.display_order,
					joined_at: joinedAt,
					created_at: createdAt,
					updated_at: now
				});
			}
		),
		delete: defineMutator(
			type({
				id: 'string'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				await assertParticipantOwner(tx, ctx, args.id);
				await tx.mutate.battle_participants.delete({ id: args.id });
			}
		)
	},

	// ==================
	// BATTLE VOTES
	// ==================
	battle_votes: {
		upsert: defineMutator(
			type({
				id: 'string',
				battle_id: 'string',
				voter_id: 'string',
				nominee_hax_id: 'string',
				award_type: userAwardEnum,
				value: 'number'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				const existing = (await assertVoteOwner(tx, ctx, args.id)) as {
					created_at?: number | null;
				} | null;
				if (!existing && !isAdmin(ctx) && args.voter_id !== ctx.userID) {
					throw new Error('Votes can only be submitted for yourself');
				}
				const voterId = isAdmin(ctx) ? args.voter_id : ctx.userID;
				const createdAt = existing?.created_at ?? Date.now();
				await tx.mutate.battle_votes.upsert({
					id: args.id,
					battle_id: args.battle_id,
					voter_id: voterId,
					nominee_hax_id: args.nominee_hax_id,
					award_type: args.award_type,
					value: args.value,
					created_at: createdAt
				});
			}
		)
	},

	// ==================
	// HAX (Code Submissions)
	// ==================
	hax: {
		insert: defineMutator(
			type({
				id: 'string',
				user_id: 'string',
				target_id: 'string',
				'battle_id?': 'string',
				html: 'string',
				css: 'string',
				type: haxTypeEnum
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				if (!isAdmin(ctx) && args.user_id !== ctx.userID) {
					throw new Error('Hax can only be created for yourself');
				}
				const userId = isAdmin(ctx) ? args.user_id : ctx.userID;
				const now = Date.now();
				await tx.mutate.hax.insert({
					id: args.id,
					user_id: userId,
					target_id: args.target_id,
					battle_id: args.battle_id,
					html: args.html,
					css: args.css,
					type: args.type,
					is_final: false,
					created_at: now,
					updated_at: now
				});
			}
		),
		update: defineMutator(
			type({
				id: 'string',
				'user_id?': 'string',
				'html?': 'string',
				'css?': 'string',
				'is_final?': 'boolean',
				'submitted_at?': 'number',
				'updated_at?': 'number',
				'diff_score?': 'number'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				await assertHaxOwner(tx, ctx, args.id);
				await tx.mutate.hax.update({
					id: args.id,
					html: args.html,
					css: args.css,
					is_final: args.is_final,
					submitted_at: args.submitted_at,
					updated_at: args.updated_at ?? Date.now(),
					// Clamp diff_score to 0-100 and update timestamp when provided
					diff_score:
						args.diff_score !== undefined
							? Math.max(0, Math.min(100, args.diff_score))
							: undefined,
					diff_score_updated_at:
						args.diff_score !== undefined ? Date.now() : undefined
				});
			}
		)
	},

	// ==================
	// HAX HISTORY (for playback/replay)
	// ==================
	hax_history: {
		insert: defineMutator(
			type({
				id: 'string',
				hax_id: 'string',
				html: 'string',
				css: 'string',
				elapsed_ms: 'number',
				sequence: 'number'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				await assertHaxOwner(tx, ctx, args.hax_id);
				// Note: Ownership check happens via the hax FK constraint -
				// only valid hax_ids can be inserted, and the client only
				// calls this for the user's own hax
				await tx.mutate.hax_history.insert({
					id: args.id,
					hax_id: args.hax_id,
					html: args.html,
					css: args.css,
					elapsed_ms: args.elapsed_ms,
					sequence: args.sequence,
					created_at: Date.now()
				});
			}
		)
	},

	// ==================
	// TARGETS (admin only - enforced server-side via ctx)
	// ==================
	targets: {
		insert: defineMutator(
			type({
				id: 'string',
				name: 'string',
				image: 'string',
				type: targetTypeEnum,
				inspo: 'string',
				created_by: 'string'
			}),
			async ({ tx, args, ctx }) => {
				// Admin check - ctx is typed via DefaultTypes in schema.ts
				if (!isAdmin(ctx)) {
					throw new Error('Only admins can create targets');
				}
				const now = Date.now();
				await tx.mutate.targets.insert({
					id: args.id,
					name: args.name,
					image: args.image,
					type: args.type,
					inspo: args.inspo,
					created_by: args.created_by,
					is_active: true,
					last_updated_at: now,
					created_at: now,
					updated_at: now
				});
			}
		),
		update: defineMutator(
			type({
				id: 'string',
				'name?': 'string',
				'image?': 'string',
				'type?': targetTypeEnum,
				'inspo?': 'string',
				'is_active?': 'boolean'
			}),
			async ({ tx, args, ctx }) => {
				// Admin check - ctx is typed via DefaultTypes in schema.ts
				if (!isAdmin(ctx)) {
					throw new Error('Only admins can update targets');
				}
				const now = Date.now();
				await tx.mutate.targets.update({
					id: args.id,
					name: args.name,
					image: args.image,
					type: args.type,
					inspo: args.inspo,
					is_active: args.is_active,
					last_updated_at: now,
					updated_at: now
				});
			}
		)
	},

	// ==================
	// RATINGS

	// ==================
	ratings: {
		upsert: defineMutator(
			type({
				id: 'string',
				user_id: 'string',
				target_id: 'string',
				difficulty: 'number',
				creativity: 'number',
				fun: 'number',
				coolness: 'number'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				const existing = (await assertRatingOwner(tx, ctx, args.id)) as {
					created_at?: number | null;
				} | null;
				if (!existing && !isAdmin(ctx) && args.user_id !== ctx.userID) {
					throw new Error('Ratings can only be submitted for yourself');
				}
				const userId = isAdmin(ctx) ? args.user_id : ctx.userID;
				const createdAt = existing?.created_at ?? Date.now();
				await tx.mutate.ratings.upsert({
					id: args.id,
					user_id: userId,
					target_id: args.target_id,
					difficulty: args.difficulty,
					creativity: args.creativity,
					fun: args.fun,
					coolness: args.coolness,
					created_at: createdAt
				});
			}
		)
	},

	// ==================
	// USER
	// ==================
	user: {
		update: defineMutator(
			type({
				id: 'string',
				'name?': 'string',
				'avatar?': 'string',
				'bio?': 'string',
				'theme?': 'string'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				if (!isAdmin(ctx) && args.id !== ctx.userID) {
					throw new Error('Users can only update their own profile');
				}
				const userId = isAdmin(ctx) ? args.id : ctx.userID;
				await tx.mutate.user.update({
					id: userId,
					name: args.name,
					avatar: args.avatar,
					bio: args.bio,
					theme: args.theme,
					updatedAt: Date.now()
				});
			}
		)
	}
});
