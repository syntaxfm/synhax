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

<!-- TODO modal don't close with escapte -->

<style>
	h3 {
		background: var(--pink);
		position: absolute;
		padding: 6px 20px;
		top: -30px;
		left: 10px;
		font-weight: 900;
	}
	dialog {
		margin: auto;
		background: var(--purp);
		color: var(--white);
		border: none;
		z-index: 1;
		overflow: visible;

		&::backdrop {
			background: rgb(0 0 0 / 0.8);
		}
		div {
			z-index: 1;
			text-align: center;
			padding: 20px 20px 30px;
			&:after {
				content: '';
				display: block;
				position: absolute;
				background: var(--purp);
				inset: 0;
				scale: 1.05;
				rotate: 1deg;
				z-index: -1;
				box-shadow: 0 0 40px var(--black);
				transition: all 0.2s ease;
			}
		}
		:global(p) {
			font-size: 24px;
			margin-bottom: 2rem;
		}
	}
</style>
