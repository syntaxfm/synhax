<script lang="ts">
	const {
		toggle,
		ontoggle,
		disabled,
		on_text,
		off_text
	}: {
		toggle: boolean;
		ontoggle: () => void;
		on_text: string;
		off_text: string;
		disabled?: boolean;
	} = $props();
</script>

<div class:disabled>
	<button class:active={toggle} onclick={ontoggle} {disabled}>{on_text}</button><button
		class:active={!toggle}
		onclick={ontoggle}
		{disabled}>{off_text}</button
	>
</div>

<style>
	div {
		display: flex;
		&.disabled {
			opacity: 0.7;
			pointer-events: none;
		}
	}
	button {
		margin: 0;
		font-size: 20px;
		color: var(--black);
		padding: 10px 30px;
		background: var(--grey);
		border-radius: 10px 0 0 10px;
		box-shadow: 1px -4px rgb(255 255 255/ 0.6) inset;
		&:hover {
			background: hsl(from var(--grey) h s 92%);
		}
		&:active {
			box-shadow: 0px 3px 8px rgb(0 0 0 / 0.3) inset;
			background: hsl(from var(--grey) h s 62%);
			position: relative;
		}
		& + button {
			border-radius: 0 10px 10px 0;
		}
	}
	button.active {
		background: var(--yellow);
		&:hover {
			background: hsl(from var(--yellow) h s 70%);
		}
		&:active {
			box-shadow: 0px 3px 8px rgb(0 0 0 / 0.3) inset;
			background: hsl(from var(--yellow) h s 38%);
			position: relative;
		}
	}
</style>
