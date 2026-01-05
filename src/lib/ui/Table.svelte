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

<input type="text" bind:value={globalFilter} placeholder="Search..." />
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
										width="200px"
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
