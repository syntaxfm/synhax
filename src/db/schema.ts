import { relations, sql } from 'drizzle-orm';
import {
	pgTable,
	pgEnum,
	uuid,
	text,
	boolean,
	integer,
	timestamp,
	index,
	uniqueIndex,
	check
} from 'drizzle-orm/pg-core';

/* =========================
   Enums
   ========================= */
export const relationship_type_enum = pgEnum('relationship_type', ['FOLLOW', 'FRIEND']);
export const target_type_enum = pgEnum('target_type', ['CODE', 'IMAGE', 'VIDEO']);
export const battle_status_enum = pgEnum('battle_status', ['PENDING', 'ACTIVE', 'COMPLETED']);
export const visibility_enum = pgEnum('visibility', ['PUBLIC', 'PRIVATE']);
export const battle_type_enum = pgEnum('battle_type', ['TIME_TRIAL', 'TIMED_MATCH']);
export const participant_status_enum = pgEnum('participant_status', [
	'PENDING',
	'READY',
	'ACTIVE',
	'DROPPED',
	'FINISHED'
]);

export const user_award_enum = pgEnum('user_award', ['MOST_ACCURATE', 'REAL_WORLD', 'BEST_FEEL']);
export const award_outcome_enum = pgEnum('award_outcome', ['AWARDED', 'VOID_TIE', 'VOID_OTHER']);
export const hax_type_enum = pgEnum('hax_type', ['BATTLE', 'SOLO']);

/* =========================
   USERS
   ========================= */
export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text().notNull(),
	email: text().notNull().unique(),
	emailVerified: boolean('email_verified')
		.$defaultFn(() => false)
		.notNull(),
	image: text(),
	createdAt: timestamp('created_at')
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	updatedAt: timestamp('updated_at')
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	role: text(),
	banned: boolean(),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires'),
	// your profile fields ↓
	avatar: text(),
	bio: text(),
	theme: text()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	impersonatedBy: text('impersonated_by')
});

export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
	updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date())
});

/* =========================
   USER_RELATIONSHIPS
   ========================= */
export const user_relationships = pgTable(
	'user_relationships',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		user_id: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		related_user_id: text('related_user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		type: relationship_type_enum('type').notNull(),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		uniqueIndex('user_relationships_unique').on(t.user_id, t.related_user_id, t.type),
		check('user_relationships_no_self', sql`${t.user_id} <> ${t.related_user_id}`)
	]
);

/* =========================
   TARGETS
   ========================= */
export const targets = pgTable(
	'targets',
	{
		id: uuid().primaryKey().defaultRandom(),
		name: text().notNull(),
		image: text().notNull(),
		type: target_type_enum().notNull(),
		inspo: text().notNull(),
		created_by: text()
			.notNull()
			.references(() => user.id, { onDelete: 'restrict' }),
		is_active: boolean().notNull().default(true),
		archived_at: timestamp({ withTimezone: true }),
		last_updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
		created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp({ withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		index('targets_is_active_idx').on(t.is_active),
		index('targets_archived_at_idx').on(t.archived_at)
	]
);

/* =========================
   BATTLES
   ========================= */
export const battles = pgTable(
	'battles',
	{
		id: uuid().primaryKey().defaultRandom(),
		date: timestamp({ withTimezone: true }).notNull().defaultNow(),
		referee_id: text()
			.notNull()
			.references(() => user.id, { onDelete: 'restrict' }),
		target_id: uuid()
			.notNull()
			.references(() => targets.id, { onDelete: 'restrict' }),
		status: battle_status_enum().notNull().default('PENDING'),
		visibility: visibility_enum().notNull().default('PRIVATE'),
		zero_room_id: text().notNull(),
		type: battle_type_enum().notNull(),
		total_time_seconds: integer().notNull(),
		overtime_seconds: integer(),
		starts_at: timestamp({ withTimezone: true }),
		ends_at: timestamp({ withTimezone: true }),
		revealed_at: timestamp({ withTimezone: true }),
		created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp({ withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		index('battles_status_idx').on(t.status),
		index('battles_visibility_idx').on(t.visibility),
		index('battles_target_idx').on(t.target_id)
	]
);

/* =========================
   BATTLE_PARTICIPANTS
   ========================= */
export const battle_participants = pgTable(
	'battle_participants',
	{
		id: uuid().primaryKey().defaultRandom(),
		battle_id: uuid()
			.notNull()
			.references(() => battles.id, { onDelete: 'cascade' }),
		user_id: text()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		status: participant_status_enum().notNull().default('PENDING'),
		display_order: integer(),
		joined_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
		last_seen_at: timestamp({ withTimezone: true }),
		finished_at: timestamp({ withTimezone: true }),
		created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp({ withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		uniqueIndex('battle_participants_unique_member').on(t.battle_id, t.user_id),
		index('battle_participants_by_status').on(t.battle_id, t.status)
	]
);

/* =========================
   HAX
   ========================= */
export const hax = pgTable(
	'hax',
	{
		id: uuid().primaryKey().defaultRandom(),
		target_id: uuid()
			.notNull()
			.references(() => targets.id, { onDelete: 'cascade' }),
		battle_id: uuid().references(() => battles.id, { onDelete: 'cascade' }),
		user_id: text()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		html: text().notNull(),
		css: text().notNull(),
		type: hax_type_enum().notNull(),
		submitted_at: timestamp({ withTimezone: true }),
		submission_locked_at: timestamp({ withTimezone: true }),
		is_final: boolean().notNull().default(false),
		rendered_preview_url: text(),
		created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp({ withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		uniqueIndex('hax_unique_user_battle').on(t.user_id, t.battle_id),
		index('hax_by_battle').on(t.battle_id),
		index('hax_by_target').on(t.target_id),
		index('hax_by_user_type').on(t.user_id, t.type)
	]
);

// HAX partial-unique for SOLO + keep unique(user_id, battle_id) for BATTLE
// Place below the hax table definition.
export const hax_unique_user_target_solo = sql`
  create unique index if not exists hax_unique_user_target_solo
  on "hax" ("user_id","target_id")
  where "type" = 'SOLO';
`;

/* =========================
   RATINGS
   ========================= */
export const ratings = pgTable(
	'ratings',
	{
		id: uuid().primaryKey().defaultRandom(),
		user_id: text()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		target_id: uuid()
			.notNull()
			.references(() => targets.id, { onDelete: 'cascade' }),
		difficulty: integer().notNull(),
		creativity: integer().notNull(),
		fun: integer().notNull(),
		coolness: integer().notNull(),
		created_at: timestamp({ withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		uniqueIndex('ratings_unique_user_target').on(t.user_id, t.target_id),
		index('ratings_target_idx').on(t.target_id)
	]
);

/* =========================
   BATTLE_VOTES
   ========================= */
export const battle_votes = pgTable(
	'battle_votes',
	{
		id: uuid().primaryKey().defaultRandom(),
		battle_id: uuid()
			.notNull()
			.references(() => battles.id, { onDelete: 'cascade' }),
		voter_id: text()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		nominee_hax_id: uuid()
			.notNull()
			.references(() => hax.id, { onDelete: 'cascade' }),
		award_type: user_award_enum().notNull(),
		locked_at: timestamp({ withTimezone: true }),
		value: integer().notNull(),
		created_at: timestamp({ withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		uniqueIndex('battle_votes_unique').on(t.battle_id, t.voter_id, t.award_type),
		index('battle_votes_by_battle_award').on(t.battle_id, t.award_type)
	]
);

// composite FK (nominee_hax_id, battle_id) -> (hax.id, hax.battle_id)
// nominee_hax_id must belong to the same battle
export const battle_votes_nominee_fk = sql`
  alter table "battle_votes"
  add constraint "battle_votes_nominee_battle_fk"
  foreign key ("nominee_hax_id","battle_id")
  references "hax"("id","battle_id")
  on delete cascade
  deferrable initially immediate;
`;

/* =========================
   AWARDS
   ========================= */
export const awards = pgTable(
	'awards',
	{
		id: uuid().primaryKey().defaultRandom(),
		user_id: text().references(() => user.id, { onDelete: 'set null' }),
		battle_id: uuid()
			.notNull()
			.references(() => battles.id, { onDelete: 'cascade' }),
		award_type: user_award_enum().notNull(),
		outcome: award_outcome_enum().notNull().default('AWARDED'),
		created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp({ withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		uniqueIndex('awards_unique_battle_award_type').on(t.battle_id, t.award_type),
		index('awards_user_idx').on(t.user_id),
		index('awards_battle_idx').on(t.battle_id)
	]
);

export const jwks = pgTable('jwks', {
	id: text('id').primaryKey(),
	publicKey: text('public_key').notNull(),
	privateKey: text('private_key').notNull(),
	createdAt: timestamp('created_at').notNull()
});

export const images = pgTable(
	'images',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		// R2 object key, e.g. "uploads/uuid-filename.jpg"
		key: text('key').notNull(),
		// owner
		user_id: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

		created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
	},
	(t) => [
		index('images_user_created_at_idx').on(t.user_id, t.created_at),
		index('images_key_idx').on(t.key)
	]
);

// Optional: relations helper (nice for typed joins)
export const images_relations = relations(images, ({ one }) => ({
	user: one(user, {
		fields: [images.user_id],
		references: [user.id]
	})
}));

// User → Session, Account, Relationship, BattleParticipant, Hax
export const user_relations = relations(user, ({ many }) => ({
	relationships: many(user_relationships, { relationName: 'fromUser' }),
	relatedRelationships: many(user_relationships, { relationName: 'toUser' }),
	participants: many(battle_participants),
	hax: many(hax)
}));

// UserRelationships → User
export const user_relationships_relations = relations(user_relationships, ({ one }) => ({
	user: one(user, {
		fields: [user_relationships.user_id],
		references: [user.id],
		relationName: 'fromUser'
	}),
	relatedUser: one(user, {
		fields: [user_relationships.related_user_id],
		references: [user.id],
		relationName: 'toUser'
	})
}));

// Battles → Target and Referee (User)
export const battle_relations = relations(battles, ({ one, many }) => ({
	target: one(targets, {
		fields: [battles.target_id],
		references: [targets.id]
	}),
	referee: one(user, {
		fields: [battles.referee_id],
		references: [user.id]
	}),
	participants: many(battle_participants),
	hax: many(hax)
}));

// BattleParticipants → Battle + User + Hax
export const battle_participants_relations = relations(battle_participants, ({ one }) => ({
	battle: one(battles, {
		fields: [battle_participants.battle_id],
		references: [battles.id]
	}),
	user: one(user, {
		fields: [battle_participants.user_id],
		references: [user.id]
	}),
	hax: one(hax, {
		fields: [battle_participants.user_id, battle_participants.battle_id],
		references: [hax.user_id, hax.battle_id]
	})
}));

// Hax → User, Battle, Target, Votes
export const hax_relations = relations(hax, ({ one, many }) => ({
	user: one(user, {
		fields: [hax.user_id],
		references: [user.id]
	}),
	battle: one(battles, {
		fields: [hax.battle_id],
		references: [battles.id]
	}),
	target: one(targets, {
		fields: [hax.target_id],
		references: [targets.id]
	}),
	votes: many(battle_votes)
}));

// --- Ratings relations
export const ratings_relations = relations(ratings, ({ one }) => ({
	user: one(user, {
		fields: [ratings.user_id],
		references: [user.id]
	}),
	target: one(targets, {
		fields: [ratings.target_id],
		references: [targets.id]
	})
}));

// --- Targets relations (add ratings backref)
export const targets_relations = relations(targets, ({ many }) => ({
	hax: many(hax),
	ratings: many(ratings),
	battles: many(battles)
}));

// --- Battle votes relations
export const battle_votes_relations = relations(battle_votes, ({ one }) => ({
	battle: one(battles, {
		fields: [battle_votes.battle_id],
		references: [battles.id]
	}),
	voter: one(user, {
		fields: [battle_votes.voter_id],
		references: [user.id]
	}),
	nomineeHax: one(hax, {
		fields: [battle_votes.nominee_hax_id],
		references: [hax.id]
	})
}));
