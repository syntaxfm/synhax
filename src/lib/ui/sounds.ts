export function play_sound(sound: HTMLAudioElement) {
	sound.currentTime = 0;
  sound.volume = 0.2;
	sound.play();
}

export function sound_on_interaction(sound: HTMLAudioElement) {
	return (element: HTMLElement) => {
		const handler = () => play_sound(sound);
		element.addEventListener('mouseenter', handler);
		element.addEventListener('focus', handler);
		return () => {
			element.removeEventListener('mouseenter', handler);
			element.removeEventListener('focus', handler);
		};
	};
}

export function sound_on_click(sound: HTMLAudioElement) {
	return (element: HTMLElement) => {
		const handler = () => play_sound(sound);
		element.addEventListener('click', handler);
		return () => element.removeEventListener('click', handler);
	};
}
