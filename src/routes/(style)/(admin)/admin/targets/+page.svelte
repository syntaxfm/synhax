<script lang="ts">
	import Table from '$lib/ui/Table.svelte';
	import { z } from '$sync/client';
	import { type Target } from '$sync/schema';
	import type { ColumnDef } from '@tanstack/svelte-table';
	import { Query } from 'zero-svelte';

	let targets = new Query(z.current.query.targets);
	const columns: ColumnDef<Target, any>[] = [
		{
			accessorKey: 'image',
			header: 'Image'
		},
		{
			accessorKey: 'id',
			header: 'ID',
			filterFn: 'includesString',
			enableColumnFilter: true,
			cell: ({ row }) => `<a href="/admin/targets/${row.original.id}/edit">${row.original.id}</a>`
		},
		{
			accessorKey: 'name',
			header: 'Name',
			filterFn: 'includesString',
			enableColumnFilter: true
		},
		{
			accessorKey: 'created_at',
			header: 'Created At',
			enableColumnFilter: false,
			cell: (info: any) => {
				const val = info.getValue();
				if (!val) return '';
				return typeof val === 'number' ? new Date(val).toLocaleString() : val;
			}
		},
		{
			accessorKey: 'type',
			header: 'Type',
			filterFn: 'equalsString',
			enableColumnFilter: true,
			cell: (info: any) => info.getValue()
		}
	];
</script>

<div class="stack" style:--gap="40px;">
	<h1>Targets</h1>
	<div class="actions">
		<a href="/admin/targets/init" class="button go_button">Create Target</a>
	</div>

	<Table data={targets.current} {columns} />
</div>
