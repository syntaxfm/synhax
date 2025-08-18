// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// File System Access API types
	interface FileSystemHandle {
		kind: 'file' | 'directory';
		name: string;
	}

	interface FileSystemFileHandle extends FileSystemHandle {
		kind: 'file';
		getFile(): Promise<File>;
	}

	interface FileSystemDirectoryHandle extends FileSystemHandle {
		kind: 'directory';
		entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
		getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
		getDirectoryHandle(
			name: string,
			options?: { create?: boolean }
		): Promise<FileSystemDirectoryHandle>;
		queryPermission(options?: {
			mode?: 'read' | 'readwrite';
		}): Promise<'granted' | 'denied' | 'prompt'>;
		requestPermission(options?: { mode?: 'read' | 'readwrite' }): Promise<'granted' | 'denied'>;
	}

	interface ShowDirectoryPickerOptions {
		id?: string;
		startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
	}

	function showDirectoryPicker(
		options?: ShowDirectoryPickerOptions
	): Promise<FileSystemDirectoryHandle>;

	interface Window {
		showDirectoryPicker?: typeof showDirectoryPicker;
	}
}

export {};
