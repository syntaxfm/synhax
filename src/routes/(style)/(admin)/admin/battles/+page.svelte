<script lang="ts">
	import Table from '$lib/ui/Table.svelte';
	import { get_z } from '$lib/z';
	import type { Battle } from '$sync/schema';
	import type { ColumnDef } from '@tanstack/svelte-table';
	import { Query } from 'zero-svelte';

	const z = get_z();

	let battles = new Query(z.query.battles);

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
	<Table data={battles.current} {columns} />
</div>
