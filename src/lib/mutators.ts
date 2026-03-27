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
import { CSS_TEMPLATE, HTML_TEMPLATE } from '$lib/constants';
import { parseTargetCode } from '$utils/code';

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
const SOLO_BATTLE_DURATION_SECONDS = 15 * 60;

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

async function getTarget(tx: RunTx, targetId: string) {
	return runOne(tx, zql.targets.where('id', targetId).one());
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
): Promise<'referee' | 'winner'> {
	const battle = (await getBattle(tx, update.id)) as {
		referee_id?: string;
		win_condition?: string | null;
	} | null;
	if (!battle?.referee_id) {
		throw new Error('Battle not found');
	}
	if (isAdmin(ctx) || battle.referee_id === ctx.userID) {
		return 'referee';
	}
	if (
		battle.win_condition === 'FIRST_TO_PERFECT' &&
		update.status === 'COMPLETED' &&
		update.winner_hax_id
	) {
		const hax = (await getHax(tx, update.winner_hax_id)) as {
			user_id?: string;
			battle_id?: string | null;
		} | null;
		if (hax?.user_id === ctx.userID && hax.battle_id === update.id) {
			return 'winner';
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

/**
 * Check if the battle associated with a hax allows saves.
 * Throws an error if the battle is in READY status (locked but not started).
 */
async function assertBattleAllowsSaves(tx: RunTx, haxId: string) {
	const hax = (await getHax(tx, haxId)) as { battle_id?: string | null } | null;
	if (!hax?.battle_id) {
		// No battle associated, allow the save
		return;
	}
	const battle = (await getBattle(tx, hax.battle_id)) as {
		status?: string | null;
		paused_at?: number | null;
	} | null;
	if (battle?.paused_at) {
		throw new Error('Battle is paused. Updates are temporarily disabled.');
	}
	if (battle?.status !== 'ACTIVE') {
		throw new Error(
			'Cannot save changes unless battle is in ACTIVE status. Wait for the battle to start.'
		);
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
		create_solo: defineMutator(
			type({
				battle_id: 'string',
				participant_id: 'string',
				hax_id: 'string',
				zero_room_id: 'string',
				target_id: 'string',
				'name?': 'string'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				const userId = ctx.userID;
				const existing = (await runOne(
					tx,
					zql.battles.where(({ and, cmp }) =>
						and(
							cmp('type', 'SOLO'),
							cmp('target_id', args.target_id),
							cmp('referee_id', userId)
						)
					)
				)) as { id?: string } | null;
				if (existing?.id) {
					throw new Error(
						'You already have a solo challenge for this target. Continue the existing attempt.'
					);
				}

				const target = (await getTarget(tx, args.target_id)) as {
					id?: string;
					name?: string | null;
					inspo?: string | null;
				} | null;
				if (!target?.id) {
					throw new Error('Target not found');
				}

				const targetCode = parseTargetCode(target.inspo ?? '');
				const starterHtml = targetCode.starter_html || HTML_TEMPLATE;
				const starterCss = targetCode.starter_css || CSS_TEMPLATE;
				const now = Date.now();
				const totalTimeSeconds = SOLO_BATTLE_DURATION_SECONDS;
				try {
					await tx.mutate.battles.insert({
						id: args.battle_id,
						name: args.name ?? `${target.name ?? 'Target'} Solo Challenge`,
						target_id: args.target_id,
						zero_room_id: args.zero_room_id,
						referee_id: userId,
						type: 'SOLO',
						status: 'PENDING',
						visibility: 'PUBLIC',
						win_condition: 'FIRST_TO_PERFECT',
						total_time_seconds: totalTimeSeconds,
						overtime_seconds: 0,
						allow_time_extension: false,
						date: now,
						created_at: now,
						updated_at: now
					});

					await tx.mutate.battle_participants.insert({
						id: args.participant_id,
						battle_id: args.battle_id,
						user_id: userId,
						status: 'READY',
						display_order: 0,
						joined_at: now,
						created_at: now,
						updated_at: now
					});

					await tx.mutate.hax.insert({
						id: args.hax_id,
						user_id: userId,
						target_id: args.target_id,
						battle_id: args.battle_id,
						html: starterHtml,
						css: starterCss,
						type: 'BATTLE',
						is_final: false,
						created_at: now,
						updated_at: now
					});
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					if (message.includes('battles_unique_solo_attempt_per_target')) {
						throw new Error(
							'You already have a solo challenge for this target. Continue the existing attempt.'
						);
					}
					throw error;
				}
			}
		),
		start_solo: defineMutator(
			type({
				id: 'string'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				const battle = (await getBattle(tx, args.id)) as {
					id?: string;
					type?: string | null;
					status?: string | null;
					referee_id?: string;
					total_time_seconds?: number | null;
				} | null;
				if (!battle?.id) {
					throw new Error('Battle not found');
				}
				if (battle.type !== 'SOLO') {
					throw new Error('Only SOLO battles can be started with start_solo');
				}
				if (!isAdmin(ctx) && battle.referee_id !== ctx.userID) {
					throw new Error('Only the solo owner can start this challenge');
				}
				if (battle.status !== 'READY') {
					throw new Error('Solo challenge can only start from READY status');
				}

				const durationSeconds = battle.total_time_seconds as number;
				const now = Date.now();
				const participants = (await tx.run(
					zql.battle_participants.where('battle_id', args.id)
				)) as { id: string }[];

				await tx.mutate.battles.update({
					id: args.id,
					status: 'ACTIVE',
					total_time_seconds: durationSeconds,
					starts_at: now,
					ends_at: now + durationSeconds * 1000,
					overtime_seconds: 0,
					allow_time_extension: false,
					win_condition: 'FIRST_TO_PERFECT',
					updated_at: now
				});

				for (const participant of participants) {
					await tx.mutate.battle_participants.update({
						id: participant.id,
						status: 'ACTIVE',
						updated_at: now
					});
				}
			}
		),
		finish_solo: defineMutator(
			type({
				id: 'string'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				const battle = (await getBattle(tx, args.id)) as {
					id?: string;
					type?: string | null;
					status?: string | null;
					referee_id?: string;
					starts_at?: number | null;
					total_time_seconds?: number | null;
					ends_at?: number | null;
					winner_hax_id?: string | null;
				} | null;
				if (!battle?.id) {
					throw new Error('Battle not found');
				}
				if (battle.type !== 'SOLO') {
					throw new Error('Only SOLO battles can be finished with finish_solo');
				}
				if (!isAdmin(ctx) && battle.referee_id !== ctx.userID) {
					throw new Error('Only the solo owner can finish this challenge');
				}
				if (battle.status === 'COMPLETED') {
					return;
				}
				if (battle.status !== 'ACTIVE') {
					throw new Error(
						'Solo challenge can only be finished from ACTIVE status'
					);
				}

				const participant = (await runOne(
					tx,
					zql.battle_participants.where(({ and, cmp }) =>
						and(
							cmp('battle_id', args.id),
							cmp('user_id', battle.referee_id ?? '')
						)
					)
				)) as { id?: string } | null;
				if (!participant?.id) {
					throw new Error('Solo participant not found');
				}

				const battleHax = (await runOne(
					tx,
					zql.hax.where(({ and, cmp }) =>
						and(
							cmp('battle_id', args.id),
							cmp('user_id', battle.referee_id ?? '')
						)
					)
				)) as { id?: string } | null;
				if (!battleHax?.id) {
					throw new Error('Solo submission not found');
				}

				const now = Date.now();
				const durationMs = Math.max(
					1,
					Math.round(
						(battle.total_time_seconds ?? SOLO_BATTLE_DURATION_SECONDS) * 1000
					)
				);
				const scheduledEndsAt =
					battle.ends_at ??
					(battle.starts_at ? battle.starts_at + durationMs : null);
				const effectiveFinishedAt = scheduledEndsAt
					? Math.min(now, scheduledEndsAt)
					: now;
				await tx.mutate.battle_participants.update({
					id: participant.id,
					status: 'FINISHED',
					finished_at: effectiveFinishedAt,
					updated_at: now
				});

				await tx.mutate.battles.update({
					id: args.id,
					status: 'COMPLETED',
					winner_hax_id: battle.winner_hax_id ?? battleHax.id,
					ends_at: effectiveFinishedAt,
					updated_at: now
				});
			}
		),
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
				// Prevent non-admins from creating battles with private targets
				if (!isAdmin(ctx)) {
					const target = (await getTarget(tx, args.target_id)) as {
						is_private?: boolean | null;
					} | null;
					if (target?.is_private) {
						throw new Error(
							'Only admins can create battles with private targets'
						);
					}
				}
				const refereeId = isAdmin(ctx) ? args.referee_id : ctx.userID;
				const now = Date.now();
				const totalTimeSeconds =
					args.type === 'SOLO'
						? SOLO_BATTLE_DURATION_SECONDS
						: args.total_time_seconds;
				const overtimeSeconds =
					args.type === 'SOLO' ? 0 : args.overtime_seconds;
				const allowTimeExtension =
					args.type === 'SOLO' ? false : (args.allow_time_extension ?? true);
				await tx.mutate.battles.insert({
					id: args.id,
					name: args.name,
					target_id: args.target_id,
					zero_room_id: args.zero_room_id,
					referee_id: refereeId,
					type: args.type,
					win_condition: args.win_condition ?? 'FIRST_TO_PERFECT',
					total_time_seconds: totalTimeSeconds,
					overtime_seconds: overtimeSeconds,
					status: args.status ?? 'PENDING',
					visibility: args.visibility ?? 'PRIVATE',
					starts_at: args.starts_at,
					ends_at: args.ends_at,
					date: now,
					allow_time_extension: allowTimeExtension,
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
				'paused_at?': 'number | null',
				'allow_time_extension?': 'boolean',
				'revealed_at?': 'number | null',
				'winner_hax_id?': 'string | null'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				const battleAccess = await assertBattleOwner(tx, ctx, {
					id: args.id,
					status: args.status,
					winner_hax_id: args.winner_hax_id
				});
				const existingBattle = (await getBattle(tx, args.id)) as {
					type?: string | null;
					status?: string | null;
				} | null;
				if (!existingBattle) {
					throw new Error('Battle not found');
				}
				const targetType = args.type ?? existingBattle.type;
				const switchedFromSoloToMultiplayer =
					existingBattle.type === 'SOLO' && targetType === 'TIMED_MATCH';
				const switchedToSolo =
					existingBattle.type !== 'SOLO' && targetType === 'SOLO';
				if (switchedToSolo) {
					if (existingBattle.status !== 'PENDING') {
						throw new Error('Battle can only switch to SOLO before it starts');
					}
					const participants = (await tx.run(
						zql.battle_participants.where('battle_id', args.id)
					)) as { status?: string | null }[];
					const activeParticipants = participants.filter(
						(participant) => participant.status !== 'DROPPED'
					);
					if (activeParticipants.length > 1) {
						throw new Error(
							'Cannot switch to SOLO while multiple participants are in the battle'
						);
					}
				}
				if (existingBattle.type === 'SOLO') {
					if (
						args.type !== undefined &&
						args.type !== 'SOLO' &&
						args.type !== 'TIMED_MATCH'
					) {
						throw new Error('SOLO battles can only switch to TIMED_MATCH');
					}
					if (
						switchedFromSoloToMultiplayer &&
						existingBattle.status !== 'PENDING'
					) {
						throw new Error(
							'SOLO battles can only switch to 2-player mode before they start'
						);
					}
					if (
						targetType === 'SOLO' &&
						args.win_condition !== undefined &&
						args.win_condition !== 'FIRST_TO_PERFECT'
					) {
						throw new Error(
							'SOLO battles must use FIRST_TO_PERFECT win condition'
						);
					}
					if (targetType === 'SOLO' && args.allow_time_extension === true) {
						throw new Error('SOLO battles cannot enable time extensions');
					}
					if (
						targetType === 'SOLO' &&
						args.overtime_seconds !== undefined &&
						args.overtime_seconds !== null &&
						args.overtime_seconds > 0
					) {
						throw new Error('SOLO battles cannot have overtime');
					}
				}
				// if (
				// 	targetType === 'SOLO' &&
				// 	args.total_time_seconds !== undefined &&
				// 	Math.round(args.total_time_seconds) !== SOLO_BATTLE_DURATION_SECONDS
				// ) {
				// 	throw new Error('SOLO battles always use a 15 minute timer');
				// }
				const totalTimeSeconds =
					targetType === 'SOLO'
						? args.total_time_seconds
						: args.total_time_seconds;
				// const totalTimeSeconds =
				// 	targetType === 'SOLO'
				// 		? SOLO_BATTLE_DURATION_SECONDS
				// 		: args.total_time_seconds;
				const overtimeSeconds =
					targetType === 'SOLO' ? 0 : args.overtime_seconds;
				const allowTimeExtension =
					targetType === 'SOLO' ? false : args.allow_time_extension;
				if (battleAccess === 'winner') {
					const disallowedWinnerFieldUpdate =
						args.name !== undefined ||
						args.visibility !== undefined ||
						args.type !== undefined ||
						args.win_condition !== undefined ||
						args.total_time_seconds !== undefined ||
						args.overtime_seconds !== undefined ||
						args.starts_at !== undefined ||
						args.paused_at !== undefined ||
						args.allow_time_extension !== undefined ||
						args.revealed_at !== undefined;
					if (disallowedWinnerFieldUpdate) {
						throw new Error(
							'Winning participant can only set battle completion fields'
						);
					}
					if (args.status !== 'COMPLETED' || !args.winner_hax_id) {
						throw new Error('Winning participant can only complete the battle');
					}
				}
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
					if (args.winner_hax_id) {
						const winnerHax = (await getHax(tx, args.winner_hax_id)) as {
							battle_id?: string | null;
						} | null;
						if (!winnerHax || winnerHax.battle_id !== args.id) {
							throw new Error('Winner hax must belong to this battle');
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
					total_time_seconds: totalTimeSeconds,
					overtime_seconds: overtimeSeconds,
					starts_at: args.starts_at,
					ends_at: args.ends_at,
					paused_at: args.paused_at,
					allow_time_extension: allowTimeExtension,
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
				const battle = (await getBattle(tx, args.battle_id)) as {
					type?: string | null;
					referee_id?: string;
				} | null;
				if (!battle) {
					throw new Error('Battle not found');
				}
				const participants = (await tx.run(
					zql.battle_participants.where('battle_id', args.battle_id)
				)) as { id?: string; status?: string | null }[];
				const maxParticipants = battle.type === 'SOLO' ? 1 : 2;
				const activeCount = Array.isArray(participants)
					? participants.filter(
							(participant) =>
								participant.status !== 'DROPPED' && participant.id !== args.id
						).length
					: 0;
				if (activeCount >= maxParticipants) {
					throw new Error(
						battle.type === 'SOLO'
							? 'SOLO challenges only allow one participant'
							: 'Battle already has two participants'
					);
				}
				const userId = isAdmin(ctx) ? args.user_id : ctx.userID;
				if (battle.type === 'SOLO' && battle.referee_id !== userId) {
					throw new Error(
						'SOLO challenges only allow the owner as a participant'
					);
				}
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
				const battle = (await getBattle(tx, args.battle_id)) as {
					type?: string | null;
					referee_id?: string;
				} | null;
				if (!battle) {
					throw new Error('Battle not found');
				}
				if (existing) {
					await assertParticipantOwner(tx, ctx, args.id);
				}
				if (!isAdmin(ctx) && args.user_id !== ctx.userID) {
					throw new Error('Participants can only be updated for yourself');
				}
				const userId = isAdmin(ctx) ? args.user_id : ctx.userID;
				if (battle.type === 'SOLO' && battle.referee_id !== userId) {
					throw new Error(
						'SOLO challenges only allow the owner as a participant'
					);
				}
				if (!existing) {
					const participants = (await tx.run(
						zql.battle_participants.where('battle_id', args.battle_id)
					)) as { id?: string; status?: string | null }[];
					const maxParticipants = battle.type === 'SOLO' ? 1 : 2;
					const activeCount = Array.isArray(participants)
						? participants.filter(
								(participant) =>
									participant.status !== 'DROPPED' && participant.id !== args.id
							).length
						: 0;
					if (activeCount >= maxParticipants) {
						throw new Error(
							battle.type === 'SOLO'
								? 'SOLO challenges only allow one participant'
								: 'Battle already has two participants'
						);
					}
				}
				const now = Date.now();
				const joinedAt = Math.trunc(existing?.joined_at ?? now);
				const createdAt = Math.trunc(existing?.created_at ?? now);
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
		),
		/** Invite a user to a battle (ref only) */
		invite: defineMutator(
			type({
				id: 'string',
				battle_id: 'string',
				user_id: 'string',
				'display_order?': 'number'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				// Verify caller is the battle's referee or admin
				const battle = (await getBattle(tx, args.battle_id)) as {
					referee_id?: string;
					type?: string | null;
				} | null;
				if (!battle?.referee_id) {
					throw new Error('Battle not found');
				}
				if (battle.type === 'SOLO') {
					throw new Error('SOLO challenges do not support invites');
				}
				if (!isAdmin(ctx) && battle.referee_id !== ctx.userID) {
					throw new Error('Only the referee can invite users');
				}
				// Check participant limit
				const participants = (await tx.run(
					zql.battle_participants.where('battle_id', args.battle_id)
				)) as { id?: string; user_id?: string; status?: string | null }[];
				const activeCount = Array.isArray(participants)
					? participants.filter((p) => p.status !== 'DROPPED').length
					: 0;
				if (activeCount >= 2) {
					throw new Error('Battle already has two participants');
				}
				// Check if user is already a participant
				const existingParticipant = Array.isArray(participants)
					? participants.find((p) => p.user_id === args.user_id)
					: null;
				if (existingParticipant) {
					throw new Error('User is already a participant in this battle');
				}
				// Create participant in PENDING state
				const now = Date.now();
				await tx.mutate.battle_participants.insert({
					id: args.id,
					battle_id: args.battle_id,
					user_id: args.user_id,
					status: 'PENDING',
					display_order: args.display_order,
					joined_at: now,
					created_at: now,
					updated_at: now
				});
			}
		),
		/** Remove a participant from a battle (ref only, before battle starts) */
		kick: defineMutator(
			type({
				id: 'string',
				battle_id: 'string'
			}),
			async ({ tx, args, ctx }) => {
				assertAuthenticated(ctx);
				// Verify caller is the battle's referee or admin
				const battle = (await getBattle(tx, args.battle_id)) as {
					referee_id?: string;
					status?: string | null;
				} | null;
				if (!battle?.referee_id) {
					throw new Error('Battle not found');
				}
				if (!isAdmin(ctx) && battle.referee_id !== ctx.userID) {
					throw new Error('Only the referee can remove participants');
				}
				// Only allow kicking before battle starts
				if (battle.status !== 'PENDING') {
					throw new Error(
						'Cannot remove participants after battle has started'
					);
				}
				// Verify participant exists
				const participant = (await getParticipant(tx, args.id)) as {
					id?: string;
					battle_id?: string;
				} | null;
				if (!participant) {
					throw new Error('Participant not found');
				}
				if (participant.battle_id !== args.battle_id) {
					throw new Error('Participant does not belong to this battle');
				}
				// Delete the participant
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
				// Reject saves when battle is in READY status (locked but not started)
				await assertBattleAllowsSaves(tx, args.id);
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
				// Reject saves when battle is in READY status (locked but not started)
				await assertBattleAllowsSaves(tx, args.hax_id);
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
				created_by: 'string',
				'is_private?': 'boolean'
			}),
			async ({ tx, args, ctx }) => {
				// Admin check - ctx is typed via DefaultTypes in schema.ts
				if (!isAdmin(ctx)) {
					throw new Error('Only admins can create targets');
				}
				if (!ctx.userID || ctx.userID === 'anon') {
					throw new Error(AUTH_ERROR);
				}
				const now = Date.now();
				await tx.mutate.targets.insert({
					id: args.id,
					name: args.name,
					image: args.image,
					type: args.type,
					inspo: args.inspo,
					created_by: ctx.userID,
					is_active: true,
					is_private: args.is_private ?? false,
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
				'is_active?': 'boolean',
				'is_private?': 'boolean'
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
					is_private: args.is_private,
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
