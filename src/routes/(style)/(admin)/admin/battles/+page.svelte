<script lang="ts">
	import Table from '$lib/ui/Table.svelte';
	import { z } from '$lib/zero.svelte';
	import type { Battle } from '$sync/schema';
	import type { ColumnDef } from '@tanstack/svelte-table';

	let battles = z.createQuery(z.query.battles);

	const columns: ColumnDef<Battle, any>[] = [
		{
			accessorKey: 'id',
			header: 'ID'
		},
		{
			accessorKey: 'status',
			header: 'Status'
		},
		{
			accessorKey: 'visibility',
			header: 'Visibility'
		},
		{
			accessorKey: 'zero_room_id',
			header: 'Room Id'
		},
		{
			accessorKey: 'target_id',
			header: 'Target'
		}
	];
</script>

<div class="stack" style:--gap="20px;">
	<h1>Battles</h1>
	<Table data={battles.data} {columns} />
</div>
