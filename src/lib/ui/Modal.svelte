<script lang="ts">
	let { open = $bindable(false), children, title } = $props();
	let dialog_el: HTMLDialogElement | null = null;

	// Effect keeps the DOM modal state in sync with the $state var
	$effect(() => {
		if (!dialog_el) return;
		if (open && !dialog_el.open) dialog_el.showModal();
		if (!open && dialog_el.open) dialog_el.close();
	});

	// Sync state when user closes via ESC, backdrop, or form[method="dialog"]
	function handle_close() {
		open = false;
	}
	function handle_cancel() {
		open = false;
	}
</script>

<dialog bind:this={dialog_el} onclose={handle_close} oncancel={handle_cancel}>
	<div>
		<h3>{title}</h3>
		{@render children()}
	</div>
</dialog>

<style>
	dialog {
		margin: auto;
		border: none;
		z-index: 1;
		overflow: visible;
		height: fit-content;
		border: 3px solid var(--border-subtle);
		&::backdrop {
			background: rgb(0 0 0 / 0.5);
			backdrop-filter: blur(4px);
		}
		div {
			z-index: 1;
			text-align: center;
			padding: 20px 20px 30px;
		}
		:global(p) {
			font-size: 24px;
			margin-bottom: 2rem;
		}
	}
</style>
