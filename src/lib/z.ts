import { Z } from 'zero-svelte';
import { getContext } from 'svelte';
import type { Schema } from '$sync/schema';

export function get_z() {
	return getContext('z') as Z<Schema>;
}
