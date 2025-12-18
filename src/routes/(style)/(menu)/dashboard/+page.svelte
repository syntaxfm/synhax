<script lang="ts">
	import LatestTargets from '$lib/targets/LatestTargets.svelte';
	import { files } from '$lib/state/FileState.svelte';
	// import BattlesInProgress from '$lib/battle_mode/BattlesInProgress.svelte'
	import blip from '$lib/ui/blip.mp3';
	import throws from '$lib/ui/throw.mp3';
	import throwforward from '$lib/ui/throwforward.mp3';
	import {
		play_sound,
		sound_on_click,
		sound_on_interaction
	} from '$lib/ui/sounds';
	import { z } from '$lib/zero.svelte';

	const blip_sound = new Audio(blip);
	const throw_sound = new Audio(throws);
	const throwforward_sound = new Audio(throwforward);
	blip_sound.preload = 'auto';
	throw_sound.preload = 'auto';
	throw_sound.volume = 0.05;
	throwforward_sound.preload = 'auto';
	throwforward_sound.volume = 0.1;

	const user = z.createQuery(z.query.user.where('id', z.userID).one());

	let battle_select = $state(false);
	files.check();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			play_sound(throw_sound);
			battle_select = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="logo">
	<svg
		width="700"
		viewBox="0 0 948 177"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M840.27 103.499L898.07 74.8988L840.27 46.0988V19.8988L947.07 74.8988L840.27 129.899V103.499Z"
			fill="black"
		/>
		<path
			d="M745.384 89.0988L709.984 38.2988H745.584L765.984 70.4988L786.384 38.2988H821.984L786.184 89.0988L821.984 140.699H786.384L765.984 107.699L745.584 140.699H709.984L745.384 89.0988Z"
			fill="black"
		/>
		<path
			d="M653.981 36.2988C667.581 36.2988 678.581 39.1654 686.981 44.8988C695.381 50.6321 699.581 59.2988 699.581 70.8988V140.699H673.781V129.299C669.248 133.699 663.981 137.099 657.981 139.499C651.981 141.765 646.248 142.899 640.781 142.899C630.648 142.899 622.581 140.365 616.581 135.299C610.581 130.232 607.581 123.299 607.581 114.499C607.581 102.099 613.981 92.6988 626.781 86.2988C631.314 84.1654 636.248 82.2988 641.581 80.6988C646.914 79.0988 655.448 76.7654 667.181 73.6988C668.648 73.4321 670.848 72.8988 673.781 72.0988C673.648 67.0321 672.048 63.4321 668.981 61.2988C665.914 59.0321 660.981 57.8988 654.181 57.8988C648.181 57.8988 643.114 58.8988 638.981 60.8988C634.981 62.8988 631.181 66.1654 627.581 70.6988L609.581 56.8988C614.514 50.2321 620.514 45.1654 627.581 41.6988C634.781 38.0988 643.581 36.2988 653.981 36.2988ZM648.781 121.099C653.448 121.099 657.914 120.099 662.181 118.099C666.581 116.099 670.448 113.165 673.781 109.299V91.2988C668.714 92.7654 663.648 94.2988 658.581 95.8988C653.648 97.3654 649.848 98.7654 647.181 100.099C641.181 102.899 638.181 106.699 638.181 111.499C638.181 114.565 639.181 116.965 641.181 118.699C643.181 120.299 645.714 121.099 648.781 121.099Z"
			fill="black"
		/>
		<path
			d="M471.255 2.8988H501.655V58.0988H556.454V2.8988H586.855V140.699H556.454V85.0988H501.655V140.699H471.255V2.8988Z"
			fill="black"
		/>
		<path
			d="M348.165 38.2988H377.165V51.0988H378.165C381.365 46.6988 385.632 43.1654 390.965 40.4988C396.299 37.6988 402.499 36.2988 409.565 36.2988C420.232 36.2988 428.765 39.6988 435.165 46.4988C441.699 53.1654 444.965 61.9654 444.965 72.8988V140.699H415.765V78.0988C415.765 72.0988 414.232 67.6321 411.165 64.6988C408.099 61.6321 403.832 60.0988 398.365 60.0988C392.232 60.0988 387.232 61.9654 383.365 65.6988C379.499 69.2988 377.565 74.0988 377.565 80.0988V140.699H348.165V38.2988Z"
			fill="black"
		/>
		<path
			d="M240.831 153.299C249.231 153.299 255.564 151.899 259.831 149.099C264.231 146.432 267.364 142.765 269.231 138.099L231.831 38.2988H263.031L283.631 109.499H285.031L305.831 38.2988H337.231L297.631 142.699C294.031 152.032 289.964 159.099 285.431 163.899C281.031 168.699 275.364 171.965 268.431 173.699C261.631 175.432 252.431 176.299 240.831 176.299V153.299Z"
			fill="black"
		/>
		<path
			d="M182.089 142.299C170.222 142.299 159.422 139.432 149.689 133.699C139.956 127.965 131.956 119.565 125.689 108.499L147.289 91.8988C151.822 100.032 157.022 106.165 162.889 110.299C168.889 114.432 175.289 116.499 182.089 116.499C188.089 116.499 192.822 115.032 196.289 112.099C199.889 109.165 201.689 105.299 201.689 100.499C201.689 96.7655 200.556 93.6988 198.289 91.2988C196.022 88.8988 193.022 86.8988 189.289 85.2988C185.556 83.6988 180.356 81.8321 173.689 79.6988C165.289 77.0321 158.289 74.3655 152.689 71.6988C147.222 68.8988 142.556 64.8988 138.689 59.6988C134.822 54.4988 132.889 47.8321 132.889 39.6988C132.889 27.4321 137.222 17.8988 145.889 11.0988C154.689 4.16546 166.089 0.698792 180.089 0.698792C189.022 0.698792 197.289 2.36546 204.889 5.6988C212.622 8.8988 219.889 14.2321 226.689 21.6988L209.489 40.2988C201.089 29.8988 190.889 24.6988 178.889 24.6988C173.956 24.6988 170.022 25.6988 167.089 27.6988C164.156 29.5655 162.689 32.2988 162.689 35.8988C162.689 40.0321 164.556 43.2988 168.289 45.6988C172.022 47.9655 178.222 50.5655 186.889 53.4988C195.822 56.4321 203.289 59.4321 209.289 62.4988C215.422 65.4321 220.622 69.8321 224.889 75.6988C229.156 81.4321 231.289 88.8988 231.289 98.0988C231.289 106.899 229.222 114.699 225.089 121.499C220.956 128.165 215.156 133.299 207.689 136.899C200.222 140.499 191.689 142.299 182.089 142.299Z"
			fill="black"
		/>
		<path
			d="M0.406036 74.8988L107.206 19.8988V46.0988L49.406 74.8988L107.206 103.499V129.899L0.406036 74.8988Z"
			fill="black"
		/>
	</svg>
</div>

<!-- {#if files.status === 'ACCESS'}
		<BattlesInProgress />
	{/if} -->

<div class="select-control" class:battle_select>
	<button
		{@attach sound_on_click(throwforward_sound)}
		{@attach sound_on_interaction(blip_sound)}
		onclick={() => {
			battle_select = true;
		}}>Battle</button
	>
	{#if user.data}
		{#if user.data.role === 'syntax'}
			<a href="/admin/targets/init" {@attach sound_on_interaction(blip_sound)}
				>New Target</a
			>
		{/if}
	{/if}
	<a href="/history" {@attach sound_on_interaction(blip_sound)}>Past Battles</a>
	<a href="/settings" {@attach sound_on_interaction(blip_sound)}>Settings</a>
</div>

<LatestTargets {battle_select} />

<style>
	svg {
		mask-image: url(/Grit%20Mask@2x.wqK0L7zb.png);
		mask-repeat: repeat;
		mask-size: 400px;
		padding: 10px;
		rotate: -2deg;
	}
	.logo {
		mask-size: 300px;
		mask-image: url(/Grit%20Mask@2x.wqK0L7zb.png);
		background: #92dd00;
	}

	.select-control {
		display: flex;
		flex-direction: column;
		grid-row: 2 / 3;
		grid-column: 1 / -1;
		gap: 20px;
		rotate: -3deg;
		transition:
			0.13s ease-out translate,
			0.1s ease-in-out opacity;
		button,
		a {
			text-align: left;
			font-size: 70px;
			display: block;
			border: none;
			cursor: pointer;
			font-weight: 900;
			color: var(--white);
			text-decoration: none;
			position: relative;
			text-transform: uppercase;
			&:before {
				content: '[';
			}
			&:after {
				content: ']';
			}
			&:focus {
				outline: none;
			}
			&:before,
			&:after {
				position: absolute;
				color: var(--hot);
				opacity: 0;
				transition:
					0.1s ease-in-out opacity,
					0.2s ease-in-out translate;
				translate: 0 0;
			}

			&:focus-visible:before,
			&:hover:before {
				opacity: 1;
				scale: 1.2;
				translate: -40px -5px;
			}
			&:focus-visible:after,
			&:hover:after {
				opacity: 1;
				scale: 1.2;
				translate: 20px -5px;
			}
		}
		&.battle_select {
			opacity: 0.2;
			translate: -20%;
			a,
			button {
				pointer-events: none;
			}
		}
	}
</style>
