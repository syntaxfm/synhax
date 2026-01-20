export const BATTLE_RATINGS = [
	'difficulty',
	'creativity',
	'fun',
	'coolness'
] as const;
export const BATTLE_AWARDS = [
	'MOST_ACCURATE',
	'REAL_WORLD',
	'BEST_FEEL'
] as const;

export const FRAME_WIDTH = 600;
export const FRAME_HEIGHT = 400;

export const HTML_TEMPLATE = `<h1>Let's Battle!</h1>`;

export const CSS_TEMPLATE = `body {
	font-family: sans-serif;
	padding: 2rem;
}
h1 {
	color: #333;
}
`;
