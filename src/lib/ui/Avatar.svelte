<script lang="ts">
	const {
		avatar,
		expression
	}: { avatar: string; expression: 'NORMAL' | 'SAD' | 'ANGRY' | 'HAPPY' } = $props();
</script>

<div>
	<img src={avatar} alt="" class={expression} />
</div>

<style>
	div {
		overflow: hidden;
		position: relative;
		aspect-ratio: 2/3;
	}
	img {
		width: 205%;
		max-width: 250%;
		position: absolute;
	}
	.ANGRY {
		right: 0;
	}
	.HAPPY {
		right: 0;
		bottom: 0;
	}
	.SAD {
		left: 0;
		bottom: 0;
	}
</style>
