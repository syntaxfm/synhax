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
	<button class:active={toggle} onclick={ontoggle} {disabled}>{on_text}</button
	><button class:active={!toggle} onclick={ontoggle} {disabled}
		>{off_text}</button
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
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--fg);
		padding: 0.65rem 1.5rem;
		background: hsl(from var(--black) h s 6%);
		border: 1px solid rgb(255 255 255 / 0.15);
		border-radius: 999px 0 0 999px;
		box-shadow: 0 10px 20px rgb(0 0 0 / 0.35);
		transition:
			transform 0.15s ease,
			box-shadow 0.2s ease,
			background 0.2s ease;
		&:hover {
			background: hsl(from var(--black) h s 10%);
			transform: translateY(-1px);
			box-shadow: 0 14px 24px rgb(0 0 0 / 0.4);
		}
		&:active {
			transform: translateY(0);
			box-shadow: 0 8px 16px rgb(0 0 0 / 0.4);
		}
		& + button {
			border-radius: 0 999px 999px 0;
			margin-left: -1px;
		}
	}
	button.active {
		background: hsl(from var(--yellow) h s 55%);
		color: #1b1100;
		border-color: rgb(255 255 255 / 0.3);
		box-shadow:
			0 12px 22px rgb(0 0 0 / 0.4),
			0 1px 0 rgb(255 255 255 / 0.35) inset;
		&:hover {
			background: hsl(from var(--yellow) h s 62%);
		}
		&:active {
			background: hsl(from var(--yellow) h s 45%);
		}
	}
</style>
