<script lang="ts">
</script>

<div class="severity-scale">
	<span class="label">MINOR</span>
	<span class="severity"></span>
	<span class="label">MAJOR</span>
</div>

<style>
	.severity-scale {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		height: 100%;
		background: var(--bg-tertiary);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		gap: 5px;
	}

	.label {
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: var(--text-muted, rgba(255, 255, 255, 0.5));
		text-transform: uppercase;
		white-space: nowrap;
	}

	.severity {
		flex: 1;
		width: 100px;
		display: block;
		height: 10px;
		border-radius: 100px;
		background: linear-gradient(
			in hsl longer hue 90deg,
			hsl(255, 100%, 50%) 0%,
			hsl(0, 100%, 50%) 100%
		);
	}
</style>
