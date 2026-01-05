<script lang="ts">
	import { copyToClipboard } from '$utils/clipboard';

	const { disabled = false, link = '', label = '' } = $props();

	const link_svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" viewBox="0 0 48 48"><title>link</title><g fill="#fff"><path d="M17,33a2,2,0,0,1-1.414-3.414l14-14a2,2,0,1,1,2.828,2.828l-14,14A1.992,1.992,0,0,1,17,33Z" fill="#fff"></path><path d="M22.624,31.032A5.967,5.967,0,0,1,20.9,35.586l-4.656,4.657a6,6,0,0,1-8.486-8.486L12.415,27.1a5.979,5.979,0,0,1,4.242-1.754c.1,0,.207.024.311.03l3.338-3.338A10.012,10.012,0,0,0,9.587,24.273L4.93,28.929A10,10,0,0,0,19.072,43.072l4.656-4.657A10.008,10.008,0,0,0,25.962,27.7Z" fill="#fff"></path><path d="M31.032,22.624A5.967,5.967,0,0,0,35.586,20.9l4.657-4.656a6,6,0,0,0-8.486-8.486L27.1,12.415a5.979,5.979,0,0,0-1.754,4.242c0,.1.024.207.03.311l-3.338,3.338A10.012,10.012,0,0,1,24.273,9.587L28.929,4.93A10,10,0,0,1,43.072,19.072l-4.657,4.656A10.008,10.008,0,0,1,27.7,25.962Z" fill="#fff"></path></g></svg>`;
	async function copy(text: string) {
		await copyToClipboard(text);
	}
</script>

<div class:disabled>
	<label for="join-link">{label}: </label>
	<div>
		<input {disabled} readonly id="join-link" value={link} />
		<button onclick={() => copy(link)} class="go_button" {disabled}
			>{@html link_svg}</button
		>
	</div>
</div>

<style>
	div {
		position: relative;
		display: inline-block;
	}

	button {
		position: absolute;
		height: 100%;
		right: 0;
	}
	input {
		border-width: 1px;
		width: 300px;
		margin-top: auto;
	}
	label {
		font-size: 12px;
	}
	.go_button {
		padding: 2px 10px;
		border: solid 1px var(--blue);
	}
</style>
