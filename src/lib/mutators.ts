import { defineMutators, defineMutator } from '@rocicorp/zero';
import { z } from 'zod';
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
 */

// Create Zod enums from Drizzle pgEnum values
const battleStatusEnum = z.enum(battle_status_enum.enumValues);
const visibilityEnum = z.enum(visibility_enum.enumValues);
const battleTypeEnum = z.enum(battle_type_enum.enumValues);
const participantStatusEnum = z.enum(participant_status_enum.enumValues);
const haxTypeEnum = z.enum(hax_type_enum.enumValues);
const userAwardEnum = z.enum(user_award_enum.enumValues);
const targetTypeEnum = z.enum(target_type_enum.enumValues);

export const mutators = defineMutators({
	// ==================
	// BATTLES
	// ==================
	battles: {
		insert: defineMutator(
			z.object({
				id: z.string(),
				target_id: z.string(),
				zero_room_id: z.string(),
				referee_id: z.string(),
				type: battleTypeEnum,
				total_time_seconds: z.number(),
				overtime_seconds: z.number().optional(),
				status: battleStatusEnum.optional(),
				visibility: visibilityEnum.optional(),
				starts_at: z.number().optional(),
				ends_at: z.number().optional()
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
			z.object({
				id: z.string(),
				status: battleStatusEnum.optional(),
				visibility: visibilityEnum.optional(),
				type: battleTypeEnum.optional(),
				total_time_seconds: z.number().optional(),
				overtime_seconds: z.number().optional(),
				starts_at: z.number().nullable().optional(),
				ends_at: z.number().nullable().optional(),
				revealed_at: z.number().nullable().optional()
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
			z.object({
				id: z.string(),
				battle_id: z.string(),
				user_id: z.string(),
				status: participantStatusEnum.optional(),
				display_order: z.number().optional()
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
			z.object({
				id: z.string(),
				status: participantStatusEnum.optional(),
				display_order: z.number().optional(),
				finished_at: z.number().optional()
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
			z.object({
				id: z.string(),
				battle_id: z.string(),
				user_id: z.string(),
				status: participantStatusEnum.optional(),
				display_order: z.number().optional()
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
			z.object({
				id: z.string()
			}),
			async ({ tx, args }) => {
				await tx.mutate.battle_participants.delete({ id: args.id });
			}
		)
	},

	// ==================
	// HAX (Code Submissions)
	// ==================
	hax: {
		insert: defineMutator(
			z.object({
				id: z.string(),
				user_id: z.string(),
				target_id: z.string(),
				battle_id: z.string().optional(),
				html: z.string(),
				css: z.string(),
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
			z.object({
				id: z.string(),
				html: z.string().optional(),
				css: z.string().optional(),
				is_final: z.boolean().optional(),
				submitted_at: z.number().optional(),
				updated_at: z.number().optional()
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
	// BATTLE VOTES
	// ==================
	battle_votes: {
		upsert: defineMutator(
			z.object({
				id: z.string(),
				battle_id: z.string(),
				voter_id: z.string(),
				nominee_hax_id: z.string(),
				award_type: userAwardEnum,
				value: z.number()
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
	// RATINGS
	// ==================
	ratings: {
		upsert: defineMutator(
			z.object({
				id: z.string(),
				user_id: z.string(),
				target_id: z.string(),
				difficulty: z.number(),
				creativity: z.number(),
				fun: z.number(),
				coolness: z.number()
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
	// TARGETS
	// ==================
	targets: {
		insert: defineMutator(
			z.object({
				id: z.string(),
				name: z.string(),
				image: z.string(),
				type: targetTypeEnum,
				inspo: z.string(),
				created_by: z.string()
			}),
			async ({ tx, args }) => {
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
			z.object({
				id: z.string(),
				name: z.string().optional(),
				image: z.string().optional(),
				type: targetTypeEnum.optional(),
				inspo: z.string().optional(),
				is_active: z.boolean().optional()
			}),
			async ({ tx, args }) => {
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
	// USER
	// ==================
	user: {
		update: defineMutator(
			z.object({
				id: z.string(),
				name: z.string().optional(),
				avatar: z.string().optional(),
				bio: z.string().optional(),
				theme: z.string().optional()
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
