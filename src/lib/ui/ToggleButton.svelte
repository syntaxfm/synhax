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
		border-radius: 4px 0 0 4px;
		& + button {
			border-radius: 0 4px 4px 0;
		}
	}
	button.active {
		color: green;
	}
</style>
