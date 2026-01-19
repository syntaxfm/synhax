type AwardType = 'REAL_WORLD' | 'BEST_FEEL' | 'MOST_ACCURATE' | (string & {});

type BattleVote = {
	value: number;
	award_type: AwardType;
};

type Participant = {
	id: string;
	hax?: {
		votes?: readonly BattleVote[] | null;
	} | null;
};

type ParticipantAggregate = {
	sum: number;
	count: number;
	awards: Map<AwardType, { sum: number; count: number }>;
};

export type ParticipantScore = {
	total_score: number;
	place: number;
	REAL_WORLD: number;
	BEST_FEEL: number;
	MOST_ACCURATE: number;
	[awardType: string]: number;
};

export type ParticipantScores = Record<string, ParticipantScore>;

export function compute_battle_scores(
	participants: readonly Participant[]
): ParticipantScores {
	// 1) aggregate votes per participant
	const by_participant = new Map<string, ParticipantAggregate>();

	for (const participant of participants) {
		const votes = participant.hax?.votes ?? [];
		const entry = by_participant.get(participant.id) ?? {
			sum: 0,
			count: 0,
			awards: new Map<AwardType, { sum: number; count: number }>()
		};
		by_participant.set(participant.id, entry);

		for (const vote of votes) {
			entry.sum += vote.value;
			entry.count += 1;

			const award = entry.awards.get(vote.award_type) ?? { sum: 0, count: 0 };
			award.sum += vote.value;
			award.count += 1;
			entry.awards.set(vote.award_type, award);
		}
	}

	// 2) compute total averages
	const results: ParticipantScores = {};
	for (const [participant_id, agg] of by_participant.entries()) {
		const total_score = agg.count === 0 ? 0 : agg.sum / agg.count;
		const out: ParticipantScore = {
			total_score,
			place: 0,
			REAL_WORLD: 0,
			BEST_FEEL: 0,
			MOST_ACCURATE: 0
		};

		// add award_type averages
		for (const [award_type, award] of agg.awards.entries()) {
			out[award_type] = award.count === 0 ? 0 : award.sum / award.count;
		}

		results[participant_id] = out;
	}

	// 3) assign places (dense ranking by total_score, descending)
	const unique_scores_desc = Array.from(
		new Set(
			Object.values(results)
				.map((result) => result.total_score)
				.sort((a, b) => b - a)
		)
	);

	for (const [participant_id, result] of Object.entries(results)) {
		result.place = unique_scores_desc.indexOf(result.total_score) + 1;
		results[participant_id] = result;
	}

	return results;
}
