import { CSS_TEMPLATE, HTML_TEMPLATE } from '$lib/constants';
import { validate_and_load_project_files } from '$utils/filesystem';
import { z, mutators } from '$lib/zero.svelte';

export class FileState {
	status: 'INITIAL' | 'NO_ACCESS' | 'ACCESS' | 'ERROR' = $state('INITIAL');
	error = $state('');
	synhax_directory_handle: FileSystemDirectoryHandle | null = $state(null);
	project_directory_handle: FileSystemDirectoryHandle | null = $state(null);
	html_file_handle: FileSystemFileHandle | null = $state(null);
	html_mtime: number | null = $state(null);
	css_file_handle: FileSystemFileHandle | null = $state(null);
	css_mtime: number | null = $state(null);
	app_frame: HTMLIFrameElement | null = $state(null);
	poll_timer: number | null = $state(null);

	private set_status(status: FileState['status']) {
		if (status !== 'ERROR') this.error = '';
		this.status = status;
	}

	private set_error(error: string) {
		this.error = error;
		this.status = 'ERROR';
	}

	// Access ~/.synhax directory
	async setup_synhax_directory() {
		if (!window.showDirectoryPicker) {
			alert('Needs File System Access API (Chrome/Edge; https or localhost).');
			return;
		}
		try {
			// Direct directory picker - user navigates to ~/.synhax or creates it
			this.synhax_directory_handle = await showDirectoryPicker({
				id: 'synhax-battle-directory',
				startIn: 'documents'
			});
			if (this.synhax_directory_handle) {
				// Save for persistence

				await this.save_directory_handle(this.synhax_directory_handle);
				this.set_status('ACCESS');
			}
		} catch (error) {
			if (error instanceof Error && error.name !== 'AbortError') {
				this.set_error(`Error selecting directory: ${error.message}`);
			}
		}
	}

	// Save directory handle to localStorage
	// Save directory handle using IndexedDB for true persistence
	async save_directory_handle(handle: FileSystemDirectoryHandle) {
		try {
			// Store the actual handle in IndexedDB
			const db = await new Promise<IDBDatabase>((resolve, reject) => {
				const request = indexedDB.open('synhax', 1);
				request.onerror = () => reject(request.error);
				request.onsuccess = () => resolve(request.result);
				request.onupgradeneeded = () => {
					const db = request.result;
					if (!db.objectStoreNames.contains('handles')) {
						db.createObjectStore('handles');
					}
				};
			});

			const transaction = db.transaction(['handles'], 'readwrite');
			const store = transaction.objectStore('handles');
			await new Promise((resolve, reject) => {
				const request = store.put(handle, 'directory');
				request.onerror = () => reject(request.error);
				request.onsuccess = () => resolve(request.result);
			});

			db.close();
		} catch (error) {
			console.warn('Could not persist directory handle:', error);
		}
	}

	// Try to restore directory handle from persistence
	// Try to restore directory handle from IndexedDB
	async restore_directory_handle() {
		try {
			const db = await new Promise<IDBDatabase>((resolve, reject) => {
				const request = indexedDB.open('synhax', 1);
				request.onerror = () => reject(request.error);
				request.onsuccess = () => resolve(request.result);
				request.onupgradeneeded = () => {
					const db = request.result;
					if (!db.objectStoreNames.contains('handles')) {
						db.createObjectStore('handles');
					}
				};
			});

			const transaction = db.transaction(['handles'], 'readonly');
			const store = transaction.objectStore('handles');

			const handle: FileSystemDirectoryHandle = await new Promise(
				(resolve, reject) => {
					const request = store.get('directory');
					request.onerror = () => reject(request.error);
					request.onsuccess = () => resolve(request.result);
				}
			);

			db.close();

			if (handle) {
				// Check current permission status without requesting
				try {
					const permission = await handle.queryPermission({ mode: 'read' });

					if (permission === 'granted') {
						// Permission already granted, verify directory is accessible
						try {
							// Try to read the directory to verify it's still valid
							const entries = handle.entries();
							await entries.next(); // Just check if we can iterate

							this.synhax_directory_handle = handle;
							this.set_status('ACCESS');
							return true;
						} catch (accessError) {
							console.warn('Directory no longer accessible:', accessError);
						}
					} else if (permission === 'prompt') {
						// Permission needs to be requested again (happens after page refresh)
						try {
							const requestedPermission = await handle.requestPermission({
								mode: 'read'
							});
							if (requestedPermission === 'granted') {
								// Try to read the directory to verify it's still valid
								const entries = handle.entries();
								await entries.next(); // Just check if we can iterate

								this.synhax_directory_handle = handle;
								this.set_status('ACCESS');
								return true;
							}
						} catch (requestError) {
							console.warn(
								'User denied permission or error requesting:',
								requestError
							);
						}
					}
				} catch (error) {
					console.warn('Error restoring directory handle:', error);
				}
			}
		} catch (error) {
			console.warn('Error restoring directory handle:', error);
		}
		return false;
	}

	async create_hax_directory(target_name: string) {
		// Create new directory
		if (!this.synhax_directory_handle) {
			this.set_error('No synhax directory handle available.');
			return;
		}

		const project_handle =
			await this.synhax_directory_handle.getDirectoryHandle(target_name, {
				create: true
			});
		// HTML
		const html_file_handle = await project_handle.getFileHandle('index.html', {
			create: true
		});
		const htmlWritable = await html_file_handle.createWritable();
		await htmlWritable.write(HTML_TEMPLATE);
		await htmlWritable.close();
		// CSS
		const css_file_handle = await project_handle.getFileHandle('styles.css', {
			create: true
		});
		const cssWritable = await css_file_handle.createWritable();
		await cssWritable.write(CSS_TEMPLATE);
		await cssWritable.close();

		const validation = await validate_and_load_project_files(
			project_handle,
			target_name
		);

		if (!validation.success) {
			throw new Error(`Project validation failed: ${target_name}`);
		}
		this.project_directory_handle = project_handle;
	}

	// Load current files from target into file state
	async load_hax_directory(target_name: string) {
		if (!this.synhax_directory_handle) {
			this.set_error('No project directory handle available.');
			return;
		}
		try {
			const project_dir =
				await this.synhax_directory_handle.getDirectoryHandle(target_name);

			// Load Project handle
			this.project_directory_handle = project_dir;

			// Take current project directory handle and load files
			const check = await this.check_project_files();
			if (check) {
				await this.load_project_files();
			}
		} catch (error) {
			console.error('Error scanning projects:', error);
			this.set_error('Project scan failed');
		}
	}

	async load_project_files() {
		if (!this.project_directory_handle || !this.synhax_directory_handle) {
			this.set_error('No project directory handle available.');
			return;
		}
		// Check for index.html
		try {
			this.html_file_handle =
				await this.project_directory_handle.getFileHandle('index.html');
		} catch (error) {
			this.set_error('Failed to load index.html');
		}

		// Check for styles.css
		try {
			const css_handle =
				await this.project_directory_handle.getFileHandle('styles.css');
			this.css_file_handle = css_handle;
		} catch (error) {
			this.set_error('Failed to load styles.css');
		}
	}

	// Check if a directory contains required project files and get file handles
	async check_project_files() {
		if (!this.project_directory_handle || !this.synhax_directory_handle) {
			this.set_error('No project directory handle available.');
			return;
		}
		try {
			const hasIndexHtml = await this.project_directory_handle
				.getFileHandle('index.html')
				.then(() => true)
				.catch(() => false);
			const hasStylesCss = await this.project_directory_handle
				.getFileHandle('styles.css')
				.then(() => true)
				.catch(() => false);
			return hasIndexHtml && hasStylesCss;
		} catch (error) {
			return false;
		}
	}

	async read_and_apply_project_files(id: string, force: boolean) {
		if (
			!this.project_directory_handle ||
			!this.synhax_directory_handle ||
			!this.html_file_handle ||
			!this.css_file_handle ||
			!id
		) {
			this.set_error('No project directory handle available.');
			return;
		}

		const html_file = await this.html_file_handle.getFile();
		const html_mtime = html_file?.lastModified;
		const html_text = await html_file?.text();

		const css_file = await this.css_file_handle.getFile();
		const css_mtime = css_file?.lastModified;
		const css_text = await css_file?.text();

		// Check if HTML file has changed
		const html_changed = force || html_mtime !== this.html_mtime;

		// Check if CSS file has changed
		const css_changed = force || css_mtime !== this.css_mtime;

		if (html_changed) {
			this.html_mtime = html_mtime;
			this.save_html(id, html_text);
		}
		if (css_changed) {
			this.css_mtime = css_mtime;
			this.save_css(id, css_text);
		}
	}

	async save_html(id: string, text: string) {
		z.mutate(
			mutators.hax.update({
				id,
				html: text,
				updated_at: Date.now()
			})
		);
	}

	async save_css(id: string, text: string) {
		z.mutate(
			mutators.hax.update({
				id,
				css: text,
				updated_at: Date.now()
			})
		);
	}

	async check() {
		// Check to see if handle exists and is valid.
		// Try to restore directory handle
		const restored = await this.restore_directory_handle();
		if (restored) {
			this.set_status('ACCESS');
		} else {
			this.set_status('NO_ACCESS');
		}
	}
}

export const files = new FileState();
