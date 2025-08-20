<script lang="ts">
	import type { Votes } from '$sync/schema';

	const { votes }: { votes: Votes[] } = $props();

	// Convert Votes[] to tally up average by type
	const tallied = $derived.by(() => {
		const averagesByType: Record<string, number> = {};

		// Group votes by award_type
		const votesByType = votes.reduce(
			(acc, vote) => {
				if (!acc[vote.award_type]) {
					acc[vote.award_type] = [];
				}
				acc[vote.award_type].push(vote.value);
				return acc;
			},
			{} as Record<string, number[]>
		);

		// Calculate average for each award type
		for (const [awardType, values] of Object.entries(votesByType)) {
			if (values.length > 0) {
				const sum = values.reduce((total, value) => total + value, 0);
				averagesByType[awardType] = sum / values.length;
			}
		}

		// Calculate overall average of all three award types
		const averageValues = Object.values(averagesByType);
		const overallAverage =
			averageValues.length > 0
				? averageValues.reduce((total, avg) => total + avg, 0) / averageValues.length
				: 0;

		return {
			...averagesByType,
			overallAverage
		};
	});

	$inspect(tallied);
</script>

<div>
	<p>Score: {tallied.overallAverage}</p>
	<p>
		Most Accurate: {tallied.MOST_ACCURATE || 'N/A'}<br />
		Real World: {tallied.REAL_WORLD || 'N/A'}<br />
		Best Feel: {tallied.BEST_FEEL || 'N/A'}
	</p>
</div>
