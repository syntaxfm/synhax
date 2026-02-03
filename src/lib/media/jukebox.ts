import airHorn from './sounds/air-horn.mp3';
import clockTick from './sounds/clock-tick.mp3';
import countdownBeep from './sounds/countdown-beep.mp3';

const sounds = {
	'air-horn': airHorn,
	'clock-tick': clockTick,
	'countdown-beep': countdownBeep
} as const;

export type SoundName = keyof typeof sounds;

class Jukebox {
	private audioElements: Map<SoundName, HTMLAudioElement> = new Map();
	private volume = 0.2;
	private muted = false;

	/**
	 * Preload all sounds. Call this once when the app starts or component mounts.
	 * Must be called in browser context. Safe to call multiple times.
	 */
	preload() {
		if (typeof window === 'undefined') return;

		// Skip if already preloaded
		if (this.audioElements.size > 0) {
			console.log('[Jukebox] Already preloaded, skipping');
			return;
		}

		console.log('[Jukebox] Preloading sounds...');
		for (const [name, src] of Object.entries(sounds)) {
			const audio = new Audio(src);
			audio.preload = 'auto';
			audio.volume = this.volume;
			this.audioElements.set(name as SoundName, audio);
			console.log(`[Jukebox] Preloaded '${name}' from ${src}`);
		}
		console.log('[Jukebox] Preload complete. Sounds:', [...this.audioElements.keys()]);
	}

	/**
	 * Play a sound by name
	 */
	play(name: SoundName) {
		if (this.muted) return;

		const audio = this.audioElements.get(name);
		if (audio) {
			audio.currentTime = 0;
			audio.volume = this.volume;
			audio.loop = false;
			audio.play().catch(() => {
				// Ignore autoplay errors - user hasn't interacted yet
			});
		}
	}

	/**
	 * Start or stop looping a sound
	 */
	loop(name: SoundName, shouldLoop: boolean) {
		console.log(`[Jukebox] loop('${name}', ${shouldLoop})`);
		const audio = this.audioElements.get(name);
		if (!audio) {
			console.log(`[Jukebox] No audio element found for '${name}'. Preloaded:`, [...this.audioElements.keys()]);
			return;
		}

		if (shouldLoop && !this.muted) {
			audio.loop = true;
			audio.volume = this.volume;
			console.log(`[Jukebox] Starting loop for '${name}', paused: ${audio.paused}, src: ${audio.src}`);
			if (audio.paused) {
				audio.currentTime = 0;
				audio.play()
					.then(() => {
						console.log(`[Jukebox] '${name}' is now playing! paused: ${audio.paused}`);
					})
					.catch((err) => {
						console.log(`[Jukebox] Autoplay error for '${name}':`, err.message);
					});
			}
		} else {
			console.log(`[Jukebox] Stopping loop for '${name}'`);
			audio.loop = false;
			audio.pause();
			audio.currentTime = 0;
		}
	}

	/**
	 * Stop a specific sound
	 */
	stop(name: SoundName) {
		const audio = this.audioElements.get(name);
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
			audio.loop = false;
		}
	}

	/**
	 * Set the volume for all sounds (0-1)
	 */
	setVolume(vol: number) {
		this.volume = Math.max(0, Math.min(1, vol));
		for (const audio of this.audioElements.values()) {
			audio.volume = this.volume;
		}
	}

	/**
	 * Mute/unmute all sounds
	 */
	setMuted(muted: boolean) {
		this.muted = muted;
	}

	/**
	 * Toggle mute state
	 */
	toggleMute() {
		this.muted = !this.muted;
		return this.muted;
	}

	/**
	 * Check if muted
	 */
	isMuted() {
		return this.muted;
	}
}

// Export a singleton instance
export const jukebox = new Jukebox();
