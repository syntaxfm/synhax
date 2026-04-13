import { drizzleZeroConfig } from 'drizzle-zero';
import * as drizzleSchema from './src/db/schema';

export default drizzleZeroConfig(drizzleSchema, {
	tables: {
		// Exclude email from client-side sync - it's not needed for display
		// and was being leaked to other users via related queries
		user: {
			id: true,
			name: true,
			username: true,
			email: false,
			emailVerified: true,
			image: true,
			createdAt: true,
			updatedAt: true,
			role: true,
			banned: true,
			banReason: true,
			banExpires: true,
			avatar: true,
			bio: true,
			theme: true
		},
		// Include all other tables as-is
		user_relationships: true,
		targets: true,
		battles: true,
		battle_participants: true,
		battle_votes: true,
		hax: true,
		hax_history: true,
		ratings: true,
		awards: true,
		images: true,
		account: true,
		session: true,
		verification: true,
		jwks: true
	}
});
