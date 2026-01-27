<script lang="ts">
	import { rankItem, compareItems } from '@tanstack/match-sorter-utils';
	import {
		getCoreRowModel,
		getFilteredRowModel,
		type ColumnFiltersState,
		type FilterFn,
		type SortingFn
	} from '@tanstack/table-core';
	import { createSvelteTable } from '@tanstack/svelte-table';

	const { data, columns } = $props();

	let columnFilters: ColumnFiltersState = $state([]);
	let globalFilter = $state('');

	// Define a custom fuzzy filter function that will apply ranking info to rows (using match-sorter utils)
	const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
		// Rank the item
		const itemRank = rankItem(row.getValue(columnId), value);

		// Store the itemRank info
		addMeta({
			itemRank
		});

		// Return if the item should be filtered in/out
		return itemRank.passed;
	};

	// Define a custom fuzzy sort function that will sort by rank if the row has ranking information
	const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
		let dir = 0;

		// Only sort by rank if the column has ranking information
		if (rowA.columnFiltersMeta[columnId]) {
			dir = compareItems(
				rowA.columnFiltersMeta[columnId]?.itemRank!,
				rowB.columnFiltersMeta[columnId]?.itemRank!
			);
		}

		// Provide an alphanumeric fallback for when the item ranks are equal
		return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
	};

	const table = $derived.by(() =>
		createSvelteTable({
			get data() {
				return (data as any[]) || [];
			},
			columns,
			filterFns: {
				fuzzy: fuzzyFilter //define as a filter function that can be used in column definitions
			},
			getCoreRowModel: getCoreRowModel(),
			getFilteredRowModel: getFilteredRowModel(),
			state: {
				globalFilter,
				columnFilters
			},
			onColumnFiltersChange: (
				updater:
					| ColumnFiltersState
					| ((prev: ColumnFiltersState) => ColumnFiltersState)
			) => {
				if (typeof updater === 'function') {
					columnFilters = updater(columnFilters);
				} else {
					columnFilters = updater;
				}
			},
			onStateChange: () => {},
			renderFallbackValue: ''
		})
	);

	function flexRender(comp: any, props: any) {
		if (!comp) return '';
		if (typeof comp === 'function') return comp(props);
		return comp;
	}
</script>

<div class="table-wrapper">
	<input
		type="text"
		bind:value={globalFilter}
		placeholder="Search..."
		class="table-search"
	/>
	{#if data && $table}
		<div class="table">
			<table>
				<thead>
					{#each $table.getHeaderGroups() as headerGroup}
						<tr>
							{#each headerGroup.headers as header}
								<th>
									{#if !header.isPlaceholder}
										{@html flexRender(
											header.column.columnDef.header,
											header.getContext()
										)}
									{/if}
								</th>
							{/each}
						</tr>
					{/each}
				</thead>
				<tbody>
					{#each $table.getRowModel().rows as row}
						<tr>
							{#each row.getVisibleCells() as cell}
								<td>
									{#if cell.column.id === 'image'}
										<img
											width="120"
											src={flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										/>
									{:else}
										{@html flexRender(
											cell.column.columnDef.cell,
											cell.getContext()
										)}
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.table-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--pad-m);
	}

	.table-search {
		max-width: 300px;
		background: var(--surface-1);
		border: 1px solid var(--border-default);
		border-radius: var(--br-s);
		padding: var(--pad-s) var(--pad-m);
		font-size: 0.85rem;
	}

	.table {
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--br-m);
		overflow: hidden;
	}

	table {
		font-size: 0.8rem;
	}

	th {
		background: var(--surface-0);
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--fg-6);
		padding: var(--pad-m) var(--pad-l);
	}

	td {
		padding: var(--pad-s) var(--pad-l);
		border-bottom: 1px solid var(--border-subtle);
	}

	tr:last-child td {
		border-bottom: none;
	}

	tbody tr:hover {
		background: var(--surface-2);
	}

	img {
		border-radius: var(--br-s);
	}
</style>
