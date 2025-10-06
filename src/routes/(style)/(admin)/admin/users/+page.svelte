<script lang="ts">
	import Table from '$lib/ui/Table.svelte';
	import { get_z } from '$lib/z';
	import type { User } from '$sync/schema';
	import type { ColumnDef } from '@tanstack/svelte-table';
	import { Query } from 'zero-svelte';

	const z = get_z();

	let users = new Query(z.query.user);

	const columns: ColumnDef<User, any>[] = [
		{
			accessorKey: 'id',
			header: 'ID',
			filterFn: 'includesString',
			enableColumnFilter: true
		},
		{
			accessorKey: 'name',
			header: 'Name',
			filterFn: 'includesString',
			enableColumnFilter: true
		},
		{
			accessorKey: 'role',
			header: 'Role',
			filterFn: 'includesString',
			enableColumnFilter: true
		},
		{
			accessorKey: 'emailVerified',
			header: 'Verified'
		}
	];
</script>

<div class="stack" style:--gap="40px;">
	<h1>Users</h1>
	<Table data={users.current} {columns} />
</div>
