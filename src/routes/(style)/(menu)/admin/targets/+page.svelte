<script lang="ts">
	import Table from '$lib/ui/Table.svelte';
	import { z, queries } from '$lib/zero.svelte';
	import type { Target } from '$sync/schema';
	import type { ColumnDef } from '@tanstack/svelte-table';

	let targets = z.createQuery(queries.targets.all());
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
			cell: ({ row }) =>
				`<a href="/admin/targets/${row.original.id}/edit">${row.original.id}</a>`
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
		},
		{
			accessorKey: 'is_private',
			header: 'Private',
			enableColumnFilter: false,
			cell: (info: any) => (info.getValue() ? '🔒 Yes' : 'No')
		}
	];
</script>

<svelte:head>
	<title>Targets | Admin - Synhax</title>
</svelte:head>

<div class="stack" style:--gap="40px;">
	<h1 class="game-title">Targets</h1>
	<div class="actions">
		<a href="/admin/targets/init" class="button go_button">Create Target</a>
	</div>
	<Table data={targets.data} {columns} />
</div>
