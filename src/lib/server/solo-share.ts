import { createDb } from '$db';
import { battles, hax, targets, user } from '$db/schema';
import { and, eq } from 'drizzle-orm';

export type PublicSoloShareData = {
	battleId: string;
	battleName: string;
	targetName: string;
	targetImage: string;
	haxId: string | null;
	userName: string;
	userUsername: string | null;
	diffScore: number | null;
	diffScoreUpdatedAt: number | null;
	haxUpdatedAt: number | null;
	completedAt: number | null;
	completionMs: number | null;
};

function toTimestamp(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	if (value instanceof Date) {
		return value.getTime();
	}

	if (typeof value === 'string') {
		const asNumber = Number(value);
		if (Number.isFinite(asNumber)) {
			return asNumber;
		}

		const asDate = Date.parse(value);
		if (!Number.isNaN(asDate)) {
			return asDate;
		}
	}

	return null;
}

function toScore(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return Math.max(0, Math.min(100, value));
	}

	if (typeof value === 'string') {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return Math.max(0, Math.min(100, parsed));
		}
	}

	return null;
}

type SoloShareContext = {
	platform?: App.Platform;
};

export async function getPublicSoloShareData(
	{ platform }: SoloShareContext,
	battleId: string
): Promise<PublicSoloShareData | null> {
	const db = createDb(platform);

	const [battleRow] = await db
		.select({
			id: battles.id,
			name: battles.name,
			refereeId: battles.referee_id,
			status: battles.status,
			visibility: battles.visibility,
			type: battles.type,
			startsAt: battles.starts_at,
			endsAt: battles.ends_at,
			targetName: targets.name,
			targetImage: targets.image,
			userName: user.name,
			userUsername: user.username
		})
		.from(battles)
		.innerJoin(targets, eq(battles.target_id, targets.id))
		.innerJoin(user, eq(battles.referee_id, user.id))
		.where(eq(battles.id, battleId))
		.limit(1);

	if (!battleRow) {
		return null;
	}

	if (
		battleRow.type !== 'SOLO' ||
		battleRow.status !== 'COMPLETED' ||
		battleRow.visibility !== 'PUBLIC'
	) {
		return null;
	}

	const [haxRow] = await db
		.select({
			haxId: hax.id,
			diffScore: hax.diff_score,
			diffScoreUpdatedAt: hax.diff_score_updated_at,
			haxUpdatedAt: hax.updated_at
		})
		.from(hax)
		.where(
			and(eq(hax.battle_id, battleId), eq(hax.user_id, battleRow.refereeId))
		)
		.limit(1);

	const startsAt = toTimestamp(battleRow.startsAt);
	const endsAt = toTimestamp(battleRow.endsAt);

	const completionMs =
		startsAt !== null && endsAt !== null
			? Math.max(0, endsAt - startsAt)
			: null;

	return {
		battleId: battleRow.id,
		battleName:
			battleRow.name ?? `${battleRow.targetName ?? 'Untitled'} Solo Challenge`,
		targetName: battleRow.targetName,
		targetImage: battleRow.targetImage,
		haxId: haxRow?.haxId ?? null,
		userName: battleRow.userName,
		userUsername: battleRow.userUsername,
		diffScore: toScore(haxRow?.diffScore),
		diffScoreUpdatedAt: toTimestamp(haxRow?.diffScoreUpdatedAt),
		haxUpdatedAt: toTimestamp(haxRow?.haxUpdatedAt),
		completedAt: endsAt,
		completionMs
	};
}
