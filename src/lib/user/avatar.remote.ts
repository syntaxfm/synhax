import { OPENAI_API_KEY, IV_API_KEY } from '$env/static/private';
import { command, getRequestEvent } from '$app/server';
import { db } from '$db';
import { user } from '$db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import OpenAI from 'openai';
import { nanoid } from 'nanoid';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

const APP_ID = 'synhax';

const AVATAR_PROMPT = `A four-panel anime-style illustration in a 2x2 grid. The character is a faceless generic male computer programmer with a bald head, no glasses, wearing a plain dark green t-shirt. Each panel shows a different exaggerated emotion: serious (top left), screaming angry (top right), sad with visible tears (bottom left), joyful with fist raised (bottom right). The background is a moody computer lab lit in warm orange tones, evoking the 90s anime style of Evangelion with bold outlines, cel shading, flat colors, and dramatic lighting. Maintain a high contrast look with sharp shadows and angular composition.`;

export const generateAvatar = command(async () => {
	const { locals } = getRequestEvent();

	// Check authentication
	if (!locals.user?.id) {
		error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	// Get user's GitHub avatar from database
	const [userData] = await db
		.select({ image: user.image })
		.from(user)
		.where(eq(user.id, userId));

	if (!userData?.image) {
		error(400, 'No GitHub avatar found');
	}

	// Fetch the GitHub avatar image
	const avatarResponse = await fetch(userData.image, { cache: 'no-store' });
	if (!avatarResponse.ok) {
		error(500, 'Failed to fetch GitHub avatar');
	}

	const avatarBuffer = await avatarResponse.arrayBuffer();

	// Style-locked prompt for anime transformation
	const stylePrompt = `
Four-panel head-and-shoulders portrait in a 2×2 grid of the SAME subject (from the input photo) with consistent framing and lighting across all panels.
Expressions per panel:
- top-left: neutral/serious
- top-right: angry, mouth wide, shouting
- bottom-left: sad with visible tears
- bottom-right: joyful, open-mouth laugh.

Art direction: late-1990s TV cel-anime look (serious Gainax-era vibe). Bold black line art, flat local colors, TWO-TONE cel shading (one hard shadow layer), subtle rim light.
Cinematic warm indoor palette (deep reds/oranges) with teal/indigo shadows; painted background with depth (walls/windows), no graphic stripes.

Hard constraints / negatives:
- no manga screentone/halftone dots
- no cross-hatching, stipple, or print texture
- no emoji/icons/bursts or comic UI
- no pastel teal backdrops, no beige panel frames, no shoji grids
- no watercolor, oil, 3D, diffusion grain, or photobash artifacts
- no style mixing; maintain consistent cel-shade across all four panels.

Keep subject identity from the input image; do not add or remove accessories. Thin black gutters between panels.
`.trim();

	// Build multipart form for image edit (style transfer)
	const form = new FormData();
	form.append('model', 'gpt-image-1');
	form.append('size', '1024x1024');
	form.append('n', '1');
	form.append('prompt', stylePrompt);

	// Attach the GitHub avatar as edit source
	const avatarFile = new File([avatarBuffer], 'input.png', { type: 'image/png' });
	form.append('image', avatarFile);

	// Call OpenAI Images Edits endpoint directly
	const editResponse = await fetch('https://api.openai.com/v1/images/edits', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${OPENAI_API_KEY}`
		},
		body: form
	});

	if (!editResponse.ok) {
		const errorText = await editResponse.text();
		console.error('OpenAI edit error:', errorText);
		error(500, 'Failed to generate anime avatar');
	}

	const editData = await editResponse.json();
	const imageUrl = editData?.data?.[0]?.url;

	if (!imageUrl) {
		error(500, 'No image returned from OpenAI');
	}

	// Download the generated image
	const imageResponse = await fetch(imageUrl);
	if (!imageResponse.ok) {
		error(500, 'Failed to download generated image');
	}

	const imageBuffer = await imageResponse.arrayBuffer();
	const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

	// Get presigned upload URL from media server
	const imageId = `avatar-${userId}-${nanoid(8)}`;
	const presignResponse = await fetch(
		'https://assets.break-code.com/generate-image-upload-url',
		{
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
		}
	);

	if (!presignResponse.ok) {
		error(500, 'Failed to get upload URL');
	}

	const { upload_url, asset_url } = await presignResponse.json();

	// Upload image to R2
	const uploadResponse = await fetch(upload_url, {
		method: 'PUT',
		headers: { 'Content-Type': 'image/png' },
		body: imageBlob
	});

	if (!uploadResponse.ok) {
		error(500, 'Failed to upload image');
	}

	// Update user's avatar in database
	await db.update(user).set({ avatar: asset_url }).where(eq(user.id, userId));

	return { avatar: asset_url };
});

export const skipAvatar = command(async () => {
	const { locals } = getRequestEvent();

	// Check authentication
	if (!locals.user?.id) {
		error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	// Update user's avatar to default unknown.png
	await db
		.update(user)
		.set({ avatar: '/unknown.png' })
		.where(eq(user.id, userId));

	return { avatar: '/unknown.png' };
});
