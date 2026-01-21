<script lang="ts">
	import { z, queries } from '$lib/zero.svelte';
	import { type ColumnDef } from '@tanstack/table-core';
	import Table from '$lib/ui/Table.svelte';

	type HaxRow = {
		id: string | null;
		created_at: number | null;
		type: 'BATTLE' | 'SOLO';
		[key: string]: any;
	};

	const hax = z.createQuery(queries.hax.all());
	const columns: ColumnDef<HaxRow, any>[] = [
		{
			accessorKey: 'id',
			header: 'ID',
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

<svelte:head>
	<title>Hax | Admin - Synhax</title>
</svelte:head>

<div class="stack" style:--gap="40px;">
	<h1>Hax</h1>
	<Table data={hax.data} {columns} />
</div>
