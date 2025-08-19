<!-- How does this change with logins? -->

<!-- Logged Out View -->

<!-- Logged in view -->
<!-- Battle -->
<!-- SEE BATTLE MODE ^^ -->
<!--SEE PRODUCER MODE ^^ -->

<!-- Profile -->
<!-- Download all battles -->

<!-- PRODUCER MODE -->
<!-- Watch Battle -->
<!-- Create Battle -->

<!-- Difference between battle and target? -->
<script>
	import { Query } from 'zero-svelte';
	import BattleMode from './BattleMode.svelte';
	import { z } from '$sync/client';
	import { page } from '$app/state';
	import Countdown from '$lib/battle_mode/Countdown.svelte';

	let battle = new Query(
		z.current.query.battles
			.where('id', page?.params?.id || '')
			.one()
			.related('referee')
			.related('participants', (q) => q.related('user'))
			.related('target')
	);
</script>

{#if battle.current?.type === 'TIMED_MATCH'}
	<Countdown battle={battle.current} view="CODE" />
{/if}

<BattleMode battle={battle.current} />
