/**
 * Visual Diff Engine Utilities
 *
 * Compares user-rendered HTML/CSS output against target images.
 * Uses pixel-by-pixel comparison with weighted color differences
 * based on human eye sensitivity.
 *
 * Reference: https://raw.githubusercontent.com/wesbos/diff/refs/heads/main/scripts.ts
 */

import { snapdom } from '@zumer/snapdom';


// ============================================================================
// Types
// ============================================================================

export interface DiffImageData {
	data: Uint8ClampedArray;
	width: number;
	height: number;
}

export interface DiffResult {
	score: number; // 0-100 similarity percentage
	diffCanvas: HTMLCanvasElement;
}

/**
 * Comparison mode for diffing:
 * - 'exact': Binary comparison, any pixel difference = mismatch
 * - 'euclidean': RGB Euclidean distance with colorTolerance threshold
 * - 'weighted': Human eye sensitivity weights (default)
 */
export type DiffMode = 'exact' | 'euclidean' | 'weighted';

export interface DiffOptions {
	scaleDownFactor?: number; // 1 = full, 2 = half resolution, etc.
	threshold?: number; // Minimum diff to count for weighted mode (default 0.005)
	/** Fixed width for comparison (both images scaled to this) */
	compareWidth?: number;
	/** Fixed height for comparison (both images scaled to this) */
	compareHeight?: number;
	/**
	 * Comparison mode:
	 * - 'exact': Any pixel difference (even 1 value) = mismatch. Score = % of exact matches.
	 * - 'euclidean': Uses RGB distance with colorTolerance. Pixels within tolerance = match.
	 * - 'weighted': Human eye sensitivity (green > red > blue). Default mode.
	 */
	mode?: DiffMode;
	/**
	 * Color tolerance for 'euclidean' mode.
	 * Uses RGB Euclidean distance: sqrt(rDiff² + gDiff² + bDiff²)
	 *
	 * Scoring:
	 * - Within tolerance = full match (100% for that pixel)
	 * - Beyond tolerance = scaled penalty based on how far beyond
	 *
	 * Typical values:
	 * - 10-15: Very strict, catches subtle anti-aliasing
	 * - 30-50: Forgiving, allows minor rendering differences
	 * - 100+: Very loose, only catches obviously different colors
	 *
	 * Max possible distance is ~442 (black to white).
	 * Default: 30
	 */
	colorTolerance?: number;
	/**
	 * Skip pixels where BOTH images have alpha = 0 (both transparent).
	 * Useful when both images have transparent backgrounds.
	 *
	 * When enabled:
	 * - Pixels transparent in BOTH images are excluded from scoring
	 * - If only one image has content at a pixel, it still counts
	 * - Prevents empty background areas from affecting scores
	 *
	 * Default: false
	 */
	ignoreTransparent?: boolean;
}

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Converts an HSL color value to RGB.
 * Assumes h, s, and l are in the range [0, 1].
 * Returns [r, g, b] in the range [0, 255].
 */
export function hslToRgb(
	h: number,
	s: number,
	l: number
): [number, number, number] {
	let r: number, g: number, b: number;

	if (s === 0) {
		r = g = b = l; // achromatic
	} else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hueToRgb(p, q, h + 1 / 3);
		g = hueToRgb(p, q, h);
		b = hueToRgb(p, q, h - 1 / 3);
	}

	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hueToRgb(p: number, q: number, t: number): number {
	if (t < 0) t += 1;
	if (t > 1) t -= 1;
	if (t < 1 / 6) return p + (q - p) * 6 * t;
	if (t < 1 / 2) return q;
	if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
	return p;
}

// ============================================================================
// Image Capture & Conversion
// ============================================================================

/**
 * Captures a DOM element as a PNG image using snapdom.
 */
export async function captureElement(
	element: HTMLElement
): Promise<HTMLImageElement> {
	console.log('[diff] Capturing element:', {
		tagName: element.tagName,
		innerHTML: element.innerHTML.substring(0, 100) + '...',
		offsetWidth: element.offsetWidth,
		offsetHeight: element.offsetHeight,
		scrollWidth: element.scrollWidth,
		scrollHeight: element.scrollHeight
	});

	// Force layout recalculation
	element.getBoundingClientRect();

	const snap = await snapdom(element);
	const img = await snap.toSvg();

	console.log('[diff] Captured image:', {
		width: img.width,
		height: img.height,
		naturalWidth: img.naturalWidth,
		naturalHeight: img.naturalHeight
	});
	return img;
}

/**
 * Loads an image URL into a canvas.
 * Sets crossOrigin to 'anonymous' for CORS support.
 */
export function loadImageAsCanvas(
	src: string,
	scaleDownFactor = 1
): Promise<HTMLCanvasElement> {
	console.log('[diff] Loading target image:', src.substring(0, 80) + '...');
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			const canvas = document.createElement('canvas');
			const width = img.naturalWidth / scaleDownFactor;
			const height = img.naturalHeight / scaleDownFactor;
			canvas.width = width;
			canvas.height = height;

			console.log('[diff] Target image loaded:', {
				naturalWidth: img.naturalWidth,
				naturalHeight: img.naturalHeight,
				canvasWidth: width,
				canvasHeight: height
			});

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('Could not get canvas context'));
				return;
			}

			ctx.drawImage(img, 0, 0, width, height);
			resolve(canvas);
		};

		img.onerror = () => {
			console.error('[diff] Failed to load target image:', src);
			reject(new Error(`Failed to load image: ${src}`));
		};

		img.src = src;
	});
}

/**
 * Converts an HTMLImageElement to a canvas.
 */
export function imageToCanvas(
	img: HTMLImageElement,
	scaleDownFactor = 1
): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	const width = (img.naturalWidth || img.width) / scaleDownFactor;
	const height = (img.naturalHeight || img.height) / scaleDownFactor;
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext('2d')!;
	ctx.drawImage(img, 0, 0, width, height);
	return canvas;
}

/**
 * Extracts pixel data from a canvas.
 */
export function getImageData(canvas: HTMLCanvasElement): DiffImageData {
	const ctx = canvas.getContext('2d')!;
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	return {
		data: imageData.data,
		width: canvas.width,
		height: canvas.height
	};
}

// ============================================================================
// Image Comparison
// ============================================================================

/**
 * Compares two images pixel-by-pixel and generates a diff visualization.
 *
 * Algorithm:
 * - Uses weighted color differences based on human eye sensitivity
 *   (green > red > blue): R*0.299 + G*0.587 + B*0.114 + A*0.1
 * - Ignores very small differences (anti-aliasing tolerance)
 * - Generates a heatmap showing where differences occur
 * - Returns a similarity score from 0-100%
 */
// Special marker for skipped pixels (transparent contestant)
const SKIPPED_PIXEL = -1;

export function compareImages(
	img1Data: DiffImageData,
	img2Data: DiffImageData,
	options: DiffOptions = {}
): DiffResult {
	const {
		threshold = 0.005,
		colorTolerance = 30,
		mode = 'euclidean',
		ignoreTransparent = true
	} = options;

	console.log('[diff] Comparing images:', {
		img1: { width: img1Data.width, height: img1Data.height },
		img2: { width: img2Data.width, height: img2Data.height },
		mode,
		ignoreTransparent,
		...(mode === 'euclidean' && { colorTolerance })
	});

	// Use the max dimensions to handle different sized images
	const width = Math.max(img1Data.width, img2Data.width);
	const height = Math.max(img1Data.height, img2Data.height);
	const totalPixels = width * height;

	console.log('[diff] Comparison dimensions:', { width, height, totalPixels });

	// Track pixel differences (meaning varies by mode)
	// SKIPPED_PIXEL (-1) marks pixels excluded from scoring
	const pixelDiffs = new Float32Array(totalPixels);
	let skippedCount = 0;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = y * width + x;

			// Get pixel from image 1 / contestant (or transparent if out of bounds)
			let r1 = 0,
				g1 = 0,
				b1 = 0,
				a1 = 0;
			if (x < img1Data.width && y < img1Data.height) {
				const i1 = (y * img1Data.width + x) * 4;
				r1 = img1Data.data[i1];
				g1 = img1Data.data[i1 + 1];
				b1 = img1Data.data[i1 + 2];
				a1 = img1Data.data[i1 + 3];
			}

			// Get pixel from image 2 / target (or transparent if out of bounds)
			let r2 = 0,
				g2 = 0,
				b2 = 0,
				a2 = 0;
			if (x < img2Data.width && y < img2Data.height) {
				const i2 = (y * img2Data.width + x) * 4;
				r2 = img2Data.data[i2];
				g2 = img2Data.data[i2 + 1];
				b2 = img2Data.data[i2 + 2];
				a2 = img2Data.data[i2 + 3];
			}

			// Skip pixels where BOTH images are transparent
			if (ignoreTransparent && a1 === 0 && a2 === 0) {
				pixelDiffs[idx] = SKIPPED_PIXEL;
				skippedCount++;
				continue;
			}

			// If one is transparent and the other is opaque, treat as maximum mismatch
			// (transparent pixel RGB values are meaningless)
			const oneTransparentOneOpaque = (a1 === 0 && a2 > 0) || (a1 > 0 && a2 === 0);
			if (oneTransparentOneOpaque) {
				pixelDiffs[idx] = 1; // Maximum difference
				continue;
			}

			const rDiff = r1 - r2;
			const gDiff = g1 - g2;
			const bDiff = b1 - b2;
			const aDiff = a1 - a2;

			if (mode === 'exact') {
				// Exact match: binary comparison - any difference = full mismatch
				const isExactMatch = rDiff === 0 && gDiff === 0 && bDiff === 0 && aDiff === 0;
				pixelDiffs[idx] = isExactMatch ? 0 : 1;
			} else if (mode === 'euclidean') {
				// Euclidean distance mode: store distance for scoring and visualization
				// sqrt(r² + g² + b²) - alpha not included in distance calculation
				const rgbDistance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
				// Store normalized distance (0-1) for visualization
				// Max RGB distance is ~441.67 (black to white)
				const maxDistance = 441.67;
				pixelDiffs[idx] = rgbDistance / maxDistance;
			} else {
				// Weighted mode: human eye sensitivity weights
				const redWeight = 0.299;
				const greenWeight = 0.587;
				const blueWeight = 0.114;
				const alphaWeight = 0.3;
				const pixelDiff =
					(Math.abs(rDiff) * redWeight +
						Math.abs(gDiff) * greenWeight +
						Math.abs(bDiff) * blueWeight +
						Math.abs(aDiff) * alphaWeight) /
					(255 * (redWeight + greenWeight + blueWeight + alphaWeight));

				pixelDiffs[idx] = pixelDiff;
			}
		}
	}

	// Effective pixel count excludes skipped pixels
	const effectivePixels = totalPixels - skippedCount;
	console.log('[diff] Effective pixels:', { totalPixels, skippedCount, effectivePixels });

	// Calculate total difference (skipping SKIPPED_PIXEL values)
	let totalDiff = 0;
	if (mode === 'exact') {
		// Exact match: count mismatched pixels
		for (let i = 0; i < totalPixels; i++) {
			const diff = pixelDiffs[i];
			if (diff !== SKIPPED_PIXEL) {
				totalDiff += diff;
			}
		}
	} else if (mode === 'euclidean') {
		// Euclidean: gradient scoring based on distance beyond tolerance
		// pixelDiffs stores normalized distance (0-1), convert tolerance to same scale
		const normalizedTolerance = colorTolerance / 441.67;
		for (let i = 0; i < totalPixels; i++) {
			const diff = pixelDiffs[i];
			if (diff !== SKIPPED_PIXEL) {
				if (diff <= normalizedTolerance) {
					// Within tolerance = full match (0 penalty)
					totalDiff += 0;
				} else {
					// Beyond tolerance = scaled penalty based on how far beyond
					// Normalize the excess: 0 (just over) to 1 (max distance)
					const excess = diff - normalizedTolerance;
					const maxExcess = 1 - normalizedTolerance;
					totalDiff += excess / maxExcess;
				}
			}
		}
	} else {
		// Weighted mode: sum weighted diffs (ignoring tiny diffs for anti-aliasing tolerance)
		for (let i = 0; i < totalPixels; i++) {
			const diff = pixelDiffs[i];
			if (diff !== SKIPPED_PIXEL && diff >= threshold) {
				totalDiff += diff;
			}
		}
	}

	// Create diff visualization canvas with heatmap
	const diffCanvas = document.createElement('canvas');
	diffCanvas.width = width;
	diffCanvas.height = height;
	const diffCtx = diffCanvas.getContext('2d')!;
	const diffImageData = diffCtx.createImageData(width, height);

	for (let i = 0; i < totalPixels; i++) {
		const pixelDiff = pixelDiffs[i];
		const rgbaIdx = i * 4;

		// Skipped pixels (transparent contestant) - leave fully transparent
		if (pixelDiff === SKIPPED_PIXEL) {
			diffImageData.data[rgbaIdx] = 0;
			diffImageData.data[rgbaIdx + 1] = 0;
			diffImageData.data[rgbaIdx + 2] = 0;
			diffImageData.data[rgbaIdx + 3] = 0;
			continue;
		}

		if (mode === 'exact') {
			// Exact match visualization: red for any mismatch, transparent for match
			if (pixelDiff === 0) {
				diffImageData.data[rgbaIdx] = 0;
				diffImageData.data[rgbaIdx + 1] = 0;
				diffImageData.data[rgbaIdx + 2] = 0;
				diffImageData.data[rgbaIdx + 3] = 0;
			} else {
				// Solid red for any mismatch
				diffImageData.data[rgbaIdx] = 255;
				diffImageData.data[rgbaIdx + 1] = 0;
				diffImageData.data[rgbaIdx + 2] = 0;
				diffImageData.data[rgbaIdx + 3] = 255;
			}
		} else if (mode === 'euclidean') {
			// Euclidean visualization: heatmap showing how different colors are
			// pixelDiff is normalized distance (0-1)
			const normalizedTolerance = colorTolerance / 441.67;

			if (pixelDiff <= normalizedTolerance) {
				// Within tolerance - leave transparent (counts as match for scoring)
				diffImageData.data[rgbaIdx] = 0;
				diffImageData.data[rgbaIdx + 1] = 0;
				diffImageData.data[rgbaIdx + 2] = 0;
				diffImageData.data[rgbaIdx + 3] = 0;
			} else {
				// Beyond tolerance - show heatmap based on distance
				// Color from blue (just over tolerance) to red (max difference)
				// Hue: 0.67 (blue, 240°) down to 0 (red) based on diff
				const hue = (1 - pixelDiff) * 0.67;
				const hsl = hslToRgb(hue, 1, 0.5);
				diffImageData.data[rgbaIdx] = hsl[0];
				diffImageData.data[rgbaIdx + 1] = hsl[1];
				diffImageData.data[rgbaIdx + 2] = hsl[2];
				diffImageData.data[rgbaIdx + 3] = 255;
			}
		} else {
			// Weighted mode: heatmap visualization
			if (pixelDiff < 0.01) {
				// Nearly identical - leave transparent
				diffImageData.data[rgbaIdx] = 0;
				diffImageData.data[rgbaIdx + 1] = 0;
				diffImageData.data[rgbaIdx + 2] = 0;
				diffImageData.data[rgbaIdx + 3] = 0;
				continue;
			}

			// Color from blue (low diff) to red (high diff) using HSL
			// Hue: 0.67 (blue, 240°) down to 0 (red) based on diff
			const hue = (1 - pixelDiff) * 0.67;
			const hsl = hslToRgb(hue, 1, 0.5);
			diffImageData.data[rgbaIdx] = hsl[0];
			diffImageData.data[rgbaIdx + 1] = hsl[1];
			diffImageData.data[rgbaIdx + 2] = hsl[2];
			diffImageData.data[rgbaIdx + 3] = 255;
		}
	}

	diffCtx.putImageData(diffImageData, 0, 0);

	// Calculate similarity score (0-100%)
	// Use effectivePixels (excludes skipped transparent pixels)
	if (effectivePixels === 0) {
		// All pixels were skipped (entirely transparent contestant)
		return { score: 0, diffCanvas };
	}

	let score: number;
	if (mode === 'exact') {
		// Exact match: percentage of pixels that match exactly
		const matchingPixels = effectivePixels - totalDiff;
		score = (matchingPixels / effectivePixels) * 100;
	} else if (mode === 'euclidean') {
		// Euclidean: gradient scoring - within tolerance = 100%, scaled penalty beyond
		const avgDiff = totalDiff / effectivePixels;
		score = Math.max(0, Math.min(100, (1 - avgDiff) * 100));
	} else {
		// Weighted mode: weighted average difference
		const avgDiff = totalDiff / effectivePixels;
		score = Math.max(0, Math.min(100, (1 - avgDiff) * 100));
	}

	console.log('[diff] Final result:', { totalDiff, effectivePixels, score, mode });

	return { score, diffCanvas };
}

// ============================================================================
// High-Level Comparison Function
// ============================================================================

/**
 * Scales an image/canvas to specific dimensions.
 */
function scaleToSize(
	source: HTMLImageElement | HTMLCanvasElement,
	width: number,
	height: number
): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d')!;
	ctx.drawImage(source, 0, 0, width, height);
	return canvas;
}

async function captureElementCanvas(
	element: HTMLElement,
	compareWidth?: number,
	compareHeight?: number
): Promise<HTMLCanvasElement> {
	const captured = await captureElement(element);
	if (compareWidth && compareHeight) {
		return scaleToSize(captured, compareWidth, compareHeight);
	}
	return imageToCanvas(captured, 1);
}

/**
 * Performs a complete comparison between a DOM element and a target image.
 *
 * @param contestantElement - The DOM element to capture (user's rendered output)
 * @param targetImageSrc - URL of the target image to compare against
 * @param options - Optional configuration for scaling and threshold
 * @returns DiffResult with score and visualization canvas
 */
export async function compareElementToImage(
	contestantElement: HTMLElement,
	targetImageSrc: string,
	options: DiffOptions = {}
): Promise<DiffResult> {
	const { compareWidth, compareHeight } = options;

	console.log('[diff] === Starting comparison ===');
	console.log('[diff] Compare dimensions:', { compareWidth, compareHeight });

	// Capture contestant element
	console.log('[diff] Step 1: Capturing contestant element...');
	const contestantCanvas = await captureElementCanvas(
		contestantElement,
		compareWidth,
		compareHeight
	);
	const contestantData = getImageData(contestantCanvas);
	console.log('[diff] Contestant data:', {
		width: contestantData.width,
		height: contestantData.height
	});

	// Load target image
	console.log('[diff] Step 2: Loading target image...');
	const targetImg = await new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('Failed to load target'));
		img.src = targetImageSrc;
	});

	// Scale target to comparison size if specified
	let targetCanvas: HTMLCanvasElement;
	if (compareWidth && compareHeight) {
		targetCanvas = scaleToSize(targetImg, compareWidth, compareHeight);
	} else {
		targetCanvas = imageToCanvas(targetImg, 1);
	}
	const targetData = getImageData(targetCanvas);
	console.log('[diff] Target data:', {
		width: targetData.width,
		height: targetData.height
	});

	// Compare
	console.log('[diff] Step 3: Comparing...');
	const result = compareImages(contestantData, targetData, options);
	console.log('[diff] === Comparison complete ===', { score: result.score });

	return result;
}

/**
 * Performs a complete comparison between two DOM elements.
 *
 * @param contestantElement - The DOM element to capture (user's rendered output)
 * @param targetElement - The target DOM element to compare against
 * @param options - Optional configuration for scaling and threshold
 * @returns DiffResult with score and visualization canvas
 */
export async function compareElementToElement(
	contestantElement: HTMLElement,
	targetElement: HTMLElement,
	options: DiffOptions = {}
): Promise<DiffResult> {
	const { compareWidth, compareHeight } = options;

	console.log('[diff] === Starting element comparison ===');
	console.log('[diff] Compare dimensions:', { compareWidth, compareHeight });

	// Capture contestant element
	console.log('[diff] Step 1: Capturing contestant element...');
	const contestantCanvas = await captureElementCanvas(
		contestantElement,
		compareWidth,
		compareHeight
	);
	const contestantData = getImageData(contestantCanvas);
	console.log('[diff] Contestant data:', {
		width: contestantData.width,
		height: contestantData.height
	});

	// Capture target element
	console.log('[diff] Step 2: Capturing target element...');
	const targetCanvas = await captureElementCanvas(
		targetElement,
		compareWidth,
		compareHeight
	);
	const targetData = getImageData(targetCanvas);
	console.log('[diff] Target data:', {
		width: targetData.width,
		height: targetData.height
	});

	// Compare
	console.log('[diff] Step 3: Comparing...');
	const result = compareImages(contestantData, targetData, options);
	console.log('[diff] === Comparison complete ===', { score: result.score });

	return result;
}
