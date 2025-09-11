import { ZERO_UPSTREAM_DB } from '$env/static/private';
import { drizzle } from 'drizzle-orm/node-postgres';
export const db = drizzle(ZERO_UPSTREAM_DB);
