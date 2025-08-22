export function compute_battle_scores(participants) {
	// 1) aggregate votes per participant
	const by_participant = new Map(); // participant_id -> { sum, count, awards: Map<award_type,{sum,count}> }

	for (const p of participants) {
		const participant_id = p.id;
		const votes = p.hax?.votes ?? [];
		let entry = by_participant.get(participant_id);
		if (!entry) {
			entry = { sum: 0, count: 0, awards: new Map() };
			by_participant.set(participant_id, entry);
		}

		for (const v of votes) {
			entry.sum += v.value;
			entry.count += 1;

			const a = entry.awards.get(v.award_type) ?? { sum: 0, count: 0 };
			a.sum += v.value;
			a.count += 1;
			entry.awards.set(v.award_type, a);
		}
	}

	// 2) compute total averages
	const results = {};
	for (const [participant_id, agg] of by_participant.entries()) {
		const total_score = agg.count === 0 ? 0 : agg.sum / agg.count;
		const out = { total_score };

		// add award_type averages
		for (const [award_type, a] of agg.awards.entries()) {
			out[award_type] = a.count === 0 ? 0 : a.sum / a.count;
		}

		results[participant_id] = out;
	}

	// 3) assign places (dense ranking by total_score, descending)
	const unique_scores_desc = Array.from(
		new Set(
			Object.values(results)
				.map((r) => r.total_score)
				.sort((a, b) => b - a)
		)
	);

	for (const [participant_id, r] of Object.entries(results)) {
		r.place = unique_scores_desc.indexOf(r.total_score) + 1;
	}

	return results;
}

export type ParticipantScores = {
	[participant_id: string]: {
		total_score: number;
		place: number;
		REAL_WORLD: number;
		BEST_FEEL: number;
		MOST_ACCURATE: number;
	};
};
