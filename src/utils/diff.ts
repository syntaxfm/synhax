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

export interface DiffOptions {
	scaleDownFactor?: number; // 1 = full, 2 = half resolution, etc.
	threshold?: number; // Minimum diff to count (default 0.005)
	/** Fixed width for comparison (both images scaled to this) */
	compareWidth?: number;
	/** Fixed height for comparison (both images scaled to this) */
	compareHeight?: number;
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
	const img = await snap.toPng();

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
export function compareImages(
	img1Data: DiffImageData,
	img2Data: DiffImageData,
	options: DiffOptions = {}
): DiffResult {
	const { threshold = 0.005 } = options;

	console.log('[diff] Comparing images:', {
		img1: { width: img1Data.width, height: img1Data.height },
		img2: { width: img2Data.width, height: img2Data.height }
	});

	// Use the max dimensions to handle different sized images
	const width = Math.max(img1Data.width, img2Data.width);
	const height = Math.max(img1Data.height, img2Data.height);
	const totalPixels = width * height;

	console.log('[diff] Comparison dimensions:', { width, height, totalPixels });

	// First pass: calculate all pixel differences
	const pixelDiffs = new Float32Array(totalPixels);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = y * width + x;

			// Get pixel from image 1 (or transparent if out of bounds)
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

			// Get pixel from image 2 (or transparent if out of bounds)
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

			// Calculate weighted difference
			// Human eye sensitivity: green > red > blue
			// Weights: 0.299 + 0.587 + 0.114 + 0.1 = 1.1
			const rDiff = Math.abs(r1 - r2);
			const gDiff = Math.abs(g1 - g2);
			const bDiff = Math.abs(b1 - b2);
			const aDiff = Math.abs(a1 - a2);

			// Weight alpha low so shadows/transparency differences are less impactful
			const pixelDiff =
				(rDiff * 0.299 + gDiff * 0.587 + bDiff * 0.114 + aDiff * 0.1) /
				(255 * 1.1);

			pixelDiffs[idx] = pixelDiff;
		}
	}

	// Calculate total difference (ignoring tiny diffs for anti-aliasing tolerance)
	let totalDiff = 0;
	for (let i = 0; i < totalPixels; i++) {
		const diff = pixelDiffs[i];
		if (diff && diff >= threshold) {
			totalDiff += diff;
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

		if (pixelDiff < 0.01) {
			// Nearly identical - leave transparent
			diffImageData.data[rgbaIdx] = 0;
			diffImageData.data[rgbaIdx + 1] = 0;
			diffImageData.data[rgbaIdx + 2] = 0;
			diffImageData.data[rgbaIdx + 3] = 0;
			continue;
		}

		// Color from green (low diff) to red (high diff) using HSL
		// Hue: 0.7 (blue-ish green) down to 0 (red) based on diff
		const hsl = hslToRgb((1 - pixelDiff) * 0.7, 1, 0.5);
		diffImageData.data[rgbaIdx] = hsl[0];
		diffImageData.data[rgbaIdx + 1] = hsl[1];
		diffImageData.data[rgbaIdx + 2] = hsl[2];
		diffImageData.data[rgbaIdx + 3] = 255;
	}

	diffCtx.putImageData(diffImageData, 0, 0);

	// Calculate similarity score (0-100%)
	if (totalPixels === 0) {
		return { score: 0, diffCanvas };
	}

	const avgDiff = totalDiff / totalPixels;
	const score = Math.max(0, Math.min(100, (1 - avgDiff) * 100));

	console.log('[diff] Final result:', { totalDiff, avgDiff, score });

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
