import { defineMutators, defineMutator } from '@rocicorp/zero';
import { type } from 'arktype';
import {
	battle_status_enum,
	visibility_enum,
	battle_type_enum,
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
const participantStatusEnum = type.enumerated(
	...participant_status_enum.enumValues
);
const haxTypeEnum = type.enumerated(...hax_type_enum.enumValues);
const userAwardEnum = type.enumerated(...user_award_enum.enumValues);
const targetTypeEnum = type.enumerated(...target_type_enum.enumValues);

export const mutators = defineMutators({
	// ==================
	// BATTLES
	// ==================
	battles: {
		insert: defineMutator(
			type({
				id: 'string',
				target_id: 'string',
				zero_room_id: 'string',
				referee_id: 'string',
				type: battleTypeEnum,
				total_time_seconds: 'number',
				'overtime_seconds?': 'number',
				'status?': battleStatusEnum,
				'visibility?': visibilityEnum,
				'starts_at?': 'number',
				'ends_at?': 'number'
			}),
			async ({ tx, args }) => {
				await tx.mutate.battles.insert({
					id: args.id,
					target_id: args.target_id,
					zero_room_id: args.zero_room_id,
					referee_id: args.referee_id,
					type: args.type,
					total_time_seconds: args.total_time_seconds,
					overtime_seconds: args.overtime_seconds,
					status: args.status,
					visibility: args.visibility,
					starts_at: args.starts_at,
					ends_at: args.ends_at
				});
			}
		),
		update: defineMutator(
			type({
				id: 'string',
				'status?': battleStatusEnum,
				'visibility?': visibilityEnum,
				'type?': battleTypeEnum,
				'total_time_seconds?': 'number',
				'overtime_seconds?': 'number',
				'starts_at?': 'number | null',
				'ends_at?': 'number | null',
				'revealed_at?': 'number | null'
			}),
			async ({ tx, args }) => {
				await tx.mutate.battles.update({
					id: args.id,
					status: args.status,
					visibility: args.visibility,
					type: args.type,
					total_time_seconds: args.total_time_seconds,
					overtime_seconds: args.overtime_seconds,
					starts_at: args.starts_at,
					ends_at: args.ends_at,
					revealed_at: args.revealed_at
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
			async ({ tx, args }) => {
				await tx.mutate.battle_participants.insert({
					id: args.id,
					battle_id: args.battle_id,
					user_id: args.user_id,
					status: args.status,
					display_order: args.display_order
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
			async ({ tx, args }) => {
				await tx.mutate.battle_participants.update({
					id: args.id,
					status: args.status,
					display_order: args.display_order,
					finished_at: args.finished_at
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
			async ({ tx, args }) => {
				await tx.mutate.battle_participants.upsert({
					id: args.id,
					battle_id: args.battle_id,
					user_id: args.user_id,
					status: args.status,
					display_order: args.display_order
				});
			}
		),
		delete: defineMutator(
			type({
				id: 'string'
			}),
			async ({ tx, args }) => {
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
			async ({ tx, args }) => {
				await tx.mutate.battle_votes.upsert({
					id: args.id,
					battle_id: args.battle_id,
					voter_id: args.voter_id,
					nominee_hax_id: args.nominee_hax_id,
					award_type: args.award_type,
					value: args.value
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
			async ({ tx, args }) => {
				await tx.mutate.hax.insert({
					id: args.id,
					user_id: args.user_id,
					target_id: args.target_id,
					battle_id: args.battle_id,
					html: args.html,
					css: args.css,
					type: args.type
				});
			}
		),
		update: defineMutator(
			type({
				id: 'string',
				'html?': 'string',
				'css?': 'string',
				'is_final?': 'boolean',
				'submitted_at?': 'number',
				'updated_at?': 'number'
			}),
			async ({ tx, args }) => {
				await tx.mutate.hax.update({
					id: args.id,
					html: args.html,
					css: args.css,
					is_final: args.is_final,
					submitted_at: args.submitted_at,
					updated_at: args.updated_at
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
				if (ctx.userRole !== 'syntax') {
					throw new Error('Only admins can create targets');
				}
				await tx.mutate.targets.insert({
					id: args.id,
					name: args.name,
					image: args.image,
					type: args.type,
					inspo: args.inspo,
					created_by: args.created_by
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
				if (ctx.userRole !== 'syntax') {
					throw new Error('Only admins can update targets');
				}
				await tx.mutate.targets.update({
					id: args.id,
					name: args.name,
					image: args.image,
					type: args.type,
					inspo: args.inspo,
					is_active: args.is_active
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
			async ({ tx, args }) => {
				await tx.mutate.ratings.upsert({
					id: args.id,
					user_id: args.user_id,
					target_id: args.target_id,
					difficulty: args.difficulty,
					creativity: args.creativity,
					fun: args.fun,
					coolness: args.coolness
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
			async ({ tx, args }) => {
				await tx.mutate.user.update({
					id: args.id,
					name: args.name,
					avatar: args.avatar,
					bio: args.bio,
					theme: args.theme
				});
			}
		)
	}
});
