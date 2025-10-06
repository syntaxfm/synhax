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
<script lang="ts">
	import { Query } from 'zero-svelte';
	import BattleMode from './BattleMode.svelte';
	import { get_z } from '$lib/z';
	import { page } from '$app/state';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import { files } from '$lib/state/FileState.svelte';
	import { to_snake_case } from '$lib/user/utils';

	const z = get_z();
	import Header from '$lib/battle_mode/Header.svelte';
	import Modal from '$lib/ui/Modal.svelte';

	let battle = new Query(
		z.query.battles
			.where('id', page?.params?.id || '')
			.one()
			.related('referee')
			.related('participants', (q) => q.related('user'))
			.related('target')
	);

	let hax = $derived.by(
		() =>
			new Query(
				z.query.hax
					.where(({ cmp, and }) =>
						and(
							cmp('battle_id', battle?.current?.id || ''),
							cmp('user_id', z.userID)
						)
					)
					.one()
			)
	);

	// Modern Svelte 5 approach with runes
	let poll_timer: NodeJS.Timeout | null = $state(null);

	$effect(() => {
		if (battle.current?.target?.name) {
			files.load_hax_directory(to_snake_case(battle.current?.target.name));
		}
	});

	$effect(() => {
		// Start the polling interval
		poll_timer = setInterval(async () => {
			try {
				await files.read_and_apply_project_files(hax.current?.id, false, z);
			} catch (error) {
				console.error('Error reading project files:', error);
			}
		}, 400);

		// Cleanup function - runs when component unmounts
		return () => {
			console.log('Stop Polling');
			if (poll_timer) {
				clearInterval(poll_timer);
				poll_timer = null;
			}
		};
	});
</script>

{#if battle.current}
	<Header battle={battle.current} target={false}>
		{#snippet detail()}{/snippet}
		{#snippet countdown()}
			{#if battle.current?.type === 'TIMED_MATCH'}
				<Countdown battle={battle.current} view="CODE" />
			{/if}
		{/snippet}
	</Header>

	{#if hax.current && battle.current}
		<BattleMode battle={battle.current} hax={hax.current} />
	{/if}
{/if}

<Modal open={files.status !== 'ACCESS'} title="File Access">
	<p>Your file access needs to be restored after refresh</p>
	<button
		onclick={() => files.restore_directory_handle()}
		class="big_button go_button">Give Access</button
	>
</Modal>
