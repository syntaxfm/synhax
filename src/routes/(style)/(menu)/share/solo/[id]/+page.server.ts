import { error } from '@sveltejs/kit';
import { getPublicSoloShareData } from '$lib/server/solo-share';
import type { PageServerLoad } from './$types';

function formatScore(score: number | null): string {
	if (score === null) {
		return 'Unscored';
	}

	return `${score.toFixed(2)}%`;
}

function formatDuration(ms: number | null): string | null {
	if (ms === null) {
		return null;
	}

	const secondsTotal = Math.floor(ms / 1000);
	const minutes = Math.floor(secondsTotal / 60)
		.toString()
		.padStart(2, '0');
	const seconds = (secondsTotal % 60).toString().padStart(2, '0');
	return `${minutes}:${seconds}`;
}

export const load: PageServerLoad = async ({ params, url }) => {
	const shareData = await getPublicSoloShareData(params.id);

	if (!shareData) {
		error(404, 'Share page not found');
	}

	const origin = url.origin;
	const recapPath = `/recap/${shareData.battleId}`;
	const recapUrl = `${origin}${recapPath}`;
	const shareUrl = `${origin}/share/solo/${shareData.battleId}`;
	const scoreVersion =
		shareData.haxUpdatedAt ??
		shareData.diffScoreUpdatedAt ??
		shareData.completedAt ??
		0;
	const ogImageUrl = `${origin}/og/solo/${shareData.battleId}.png?v=${scoreVersion}`;

	const playerLabel =
		shareData.userUsername && shareData.userUsername.length > 0
			? `@${shareData.userUsername}`
			: shareData.userName;
	const scoreLabel = formatScore(shareData.diffScore);
	const durationLabel = formatDuration(shareData.completionMs);

	const title = `${playerLabel} scored ${scoreLabel} on ${shareData.targetName} in Synhax Solo`;
	const description = durationLabel
		? `Final score: ${scoreLabel} in ${durationLabel}. View the public recap and challenge this target on Synhax.`
		: `Final score: ${scoreLabel}. View the public recap and challenge this target on Synhax.`;

	return {
		battleId: shareData.battleId,
		haxId: shareData.haxId,
		recapPath,
		recapUrl,
		shareUrl,
		title,
		description,
		ogImageUrl,
		ogImageAlt: `${playerLabel} scored ${scoreLabel} on ${shareData.targetName}`,
		fallback: {
			playerLabel,
			targetName: shareData.targetName,
			targetImage: shareData.targetImage,
			scoreLabel,
			durationLabel
		}
	};
};
