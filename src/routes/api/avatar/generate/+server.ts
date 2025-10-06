import { OPENAI_API_KEY, IV_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { db } from '$db';
import { user } from '$db/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { nanoid } from 'nanoid';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

const APP_ID = 'synhax';

const AVATAR_PROMPT = `A four-panel anime-style illustration in a 2x2 grid. The character is a faceless generic male computer programmer with a bald head, no glasses, wearing a plain dark green t-shirt. Each panel shows a different exaggerated emotion: serious (top left), screaming angry (top right), sad with visible tears (bottom left), joyful with fist raised (bottom right). The background is a moody computer lab lit in warm orange tones, evoking the 90s anime style of Evangelion with bold outlines, cel shading, flat colors, and dramatic lighting. Maintain a high contrast look with sharp shadows and angular composition.`;

export async function POST({ locals }) {
	try {
		// Check authentication
		if (!locals.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = locals.user.id;

		// Generate image with OpenAI
		const response = await openai.images.generate({
			model: 'dall-e-3',
			prompt: AVATAR_PROMPT,
			size: '1024x1024',
			quality: 'standard',
			n: 1
		});

		const imageUrl = response.data[0]?.url;
		if (!imageUrl) {
			return json({ error: 'Failed to generate image' }, { status: 500 });
		}

		// Download the generated image
		const imageResponse = await fetch(imageUrl);
		if (!imageResponse.ok) {
			return json({ error: 'Failed to download generated image' }, { status: 500 });
		}

		const imageBuffer = await imageResponse.arrayBuffer();
		const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

		// Get presigned upload URL from media server
		const imageId = `avatar-${userId}-${nanoid(8)}`;
		const presignResponse = await fetch('https://assets.break-code.com/generate-image-upload-url', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': IV_API_KEY
			},
			body: JSON.stringify({
				app_id: APP_ID,
				image_id: imageId,
				content_type: 'image/png'
			})
		});

		if (!presignResponse.ok) {
			return json({ error: 'Failed to get upload URL' }, { status: 500 });
		}

		const { upload_url, asset_url } = await presignResponse.json();

		// Upload image to R2
		const uploadResponse = await fetch(upload_url, {
			method: 'PUT',
			headers: { 'Content-Type': 'image/png' },
			body: imageBlob
		});

		if (!uploadResponse.ok) {
			return json({ error: 'Failed to upload image' }, { status: 500 });
		}

		// Update user's avatar in database
		await db.update(user).set({ avatar: asset_url }).where(eq(user.id, userId));

		return json({ avatar: asset_url }, { status: 200 });
	} catch (error) {
		console.error('Avatar generation error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to generate avatar' },
			{ status: 500 }
		);
	}
}
