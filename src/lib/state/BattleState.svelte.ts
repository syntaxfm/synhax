type Status = 'INITIAL' | 'COUNTDOWN' | 'ACTIVE' | 'ENDED';

export class BattleState {
	time: number = $state(0);
	status: Status = 'INITIAL';

	start() {
		this.status = 'ACTIVE';
		this.time = 0; // TODO make this a timer
	}
}
