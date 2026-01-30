import { betterAuth } from 'better-auth';
import { admin, jwt } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '../db';
import * as schema from '../db/schema';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema
	}),
	socialProviders: {
		github: {
			clientId: GITHUB_CLIENT_ID,
			clientSecret: GITHUB_CLIENT_SECRET,
			mapProfileToUser: (profile) => ({
				username: profile.login
			})
		}
	},
	user: {
		additionalFields: {
			username: {
				type: 'string',
				required: false
			}
		}
	},
	plugins: [
		admin(),
		jwt({
			jwt: {
				expirationTime: '7d'
			}
		})
	]
});
