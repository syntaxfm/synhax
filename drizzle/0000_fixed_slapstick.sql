CREATE TYPE "public"."award_outcome" AS ENUM('AWARDED', 'VOID_TIE', 'VOID_OTHER');--> statement-breakpoint
CREATE TYPE "public"."battle_status" AS ENUM('PENDING', 'READY', 'ACTIVE', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."battle_type" AS ENUM('TIME_TRIAL', 'TIMED_MATCH', 'SOLO');--> statement-breakpoint
CREATE TYPE "public"."hax_type" AS ENUM('BATTLE', 'SOLO');--> statement-breakpoint
CREATE TYPE "public"."participant_status" AS ENUM('PENDING', 'READY', 'ACTIVE', 'DROPPED', 'FINISHED');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('FOLLOW', 'FRIEND');--> statement-breakpoint
CREATE TYPE "public"."target_type" AS ENUM('CODE', 'IMAGE', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."user_award" AS ENUM('MOST_ACCURATE', 'REAL_WORLD', 'BEST_FEEL');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('PUBLIC', 'PRIVATE');--> statement-breakpoint
CREATE TYPE "public"."win_condition" AS ENUM('VOTING', 'FIRST_TO_PERFECT');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"battle_id" uuid NOT NULL,
	"award_type" "user_award" NOT NULL,
	"outcome" "award_outcome" DEFAULT 'AWARDED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battle_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battle_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "participant_status" DEFAULT 'PENDING' NOT NULL,
	"display_order" integer,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battle_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battle_id" uuid NOT NULL,
	"voter_id" text NOT NULL,
	"nominee_hax_id" uuid NOT NULL,
	"award_type" "user_award" NOT NULL,
	"locked_at" timestamp with time zone,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"referee_id" text NOT NULL,
	"target_id" uuid NOT NULL,
	"status" "battle_status" DEFAULT 'PENDING' NOT NULL,
	"visibility" "visibility" DEFAULT 'PRIVATE' NOT NULL,
	"zero_room_id" text NOT NULL,
	"type" "battle_type" NOT NULL,
	"win_condition" "win_condition" DEFAULT 'FIRST_TO_PERFECT' NOT NULL,
	"total_time_seconds" integer NOT NULL,
	"overtime_seconds" integer,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"paused_at" timestamp with time zone,
	"allow_time_extension" boolean DEFAULT true NOT NULL,
	"revealed_at" timestamp with time zone,
	"winner_hax_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hax" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_id" uuid NOT NULL,
	"battle_id" uuid,
	"user_id" text NOT NULL,
	"html" text NOT NULL,
	"css" text NOT NULL,
	"type" "hax_type" NOT NULL,
	"submitted_at" timestamp with time zone,
	"submission_locked_at" timestamp with time zone,
	"is_final" boolean DEFAULT false NOT NULL,
	"rendered_preview_url" text,
	"diff_score" double precision,
	"diff_score_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hax_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hax_id" uuid NOT NULL,
	"html" text NOT NULL,
	"css" text NOT NULL,
	"elapsed_ms" integer NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jwks" (
	"id" text PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"target_id" uuid NOT NULL,
	"difficulty" integer NOT NULL,
	"creativity" integer NOT NULL,
	"fun" integer NOT NULL,
	"coolness" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"image" text NOT NULL,
	"type" "target_type" NOT NULL,
	"inspo" text NOT NULL,
	"created_by" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	"avatar" text,
	"bio" text,
	"theme" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"related_user_id" text NOT NULL,
	"type" "relationship_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_relationships_no_self" CHECK ("user_relationships"."user_id" <> "user_relationships"."related_user_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_votes" ADD CONSTRAINT "battle_votes_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_votes" ADD CONSTRAINT "battle_votes_voter_id_user_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_votes" ADD CONSTRAINT "battle_votes_nominee_hax_id_hax_id_fk" FOREIGN KEY ("nominee_hax_id") REFERENCES "public"."hax"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_referee_id_user_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_target_id_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hax" ADD CONSTRAINT "hax_target_id_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hax" ADD CONSTRAINT "hax_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hax" ADD CONSTRAINT "hax_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hax_history" ADD CONSTRAINT "hax_history_hax_id_hax_id_fk" FOREIGN KEY ("hax_id") REFERENCES "public"."hax"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_target_id_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targets" ADD CONSTRAINT "targets_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_related_user_id_user_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "awards_unique_battle_award_type" ON "awards" USING btree ("battle_id","award_type");--> statement-breakpoint
CREATE INDEX "awards_user_idx" ON "awards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "awards_battle_idx" ON "awards" USING btree ("battle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "battle_participants_unique_member" ON "battle_participants" USING btree ("battle_id","user_id");--> statement-breakpoint
CREATE INDEX "battle_participants_by_status" ON "battle_participants" USING btree ("battle_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "battle_votes_unique_per_nominee" ON "battle_votes" USING btree ("battle_id","voter_id","award_type","nominee_hax_id");--> statement-breakpoint
CREATE INDEX "battle_votes_by_battle_award" ON "battle_votes" USING btree ("battle_id","award_type");--> statement-breakpoint
CREATE INDEX "battles_status_idx" ON "battles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "battles_visibility_idx" ON "battles" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "battles_target_idx" ON "battles" USING btree ("target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "battles_unique_solo_attempt_per_target" ON "battles" USING btree ("referee_id","target_id") WHERE "battles"."type" = 'SOLO';--> statement-breakpoint
CREATE UNIQUE INDEX "hax_unique_user_battle" ON "hax" USING btree ("user_id","battle_id");--> statement-breakpoint
CREATE INDEX "hax_by_battle" ON "hax" USING btree ("battle_id");--> statement-breakpoint
CREATE INDEX "hax_by_target" ON "hax" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "hax_by_user_type" ON "hax" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "hax_history_by_hax" ON "hax_history" USING btree ("hax_id");--> statement-breakpoint
CREATE INDEX "hax_history_playback" ON "hax_history" USING btree ("hax_id","sequence");--> statement-breakpoint
CREATE INDEX "images_user_created_at_idx" ON "images" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "images_key_idx" ON "images" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "ratings_unique_user_target" ON "ratings" USING btree ("user_id","target_id");--> statement-breakpoint
CREATE INDEX "ratings_target_idx" ON "ratings" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "targets_is_active_idx" ON "targets" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "targets_archived_at_idx" ON "targets" USING btree ("archived_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_relationships_unique" ON "user_relationships" USING btree ("user_id","related_user_id","type");