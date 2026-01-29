import { CSS_TEMPLATE, HTML_TEMPLATE } from '$lib/constants';
import { validate_and_load_project_files } from '$utils/filesystem';
import { z, mutators } from '$lib/zero.svelte';

type HaxHistoryContext = {
	battle_starts_at: number | null;
	current_html: string;
	current_css: string;
};

type HaxFolderInput = {
	id?: string | null;
	name?: string | null;
	starts_at?: number | null;
	date?: number | null;
	created_at?: number | null;
};

const pad_time = (value: number) => String(value).padStart(2, '0');

const slugify_name = (name: string) => {
	return name
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
};

const format_timestamp = (timestamp: number) => {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = pad_time(date.getMonth() + 1);
	const day = pad_time(date.getDate());
	const hours = pad_time(date.getHours());
	const minutes = pad_time(date.getMinutes());
	return `${year}${month}${day}-${hours}${minutes}`;
};

export const build_hax_folder_name = (input: HaxFolderInput) => {
	const slug = input.name ? slugify_name(input.name) : '';
	const timestamp_value =
		input.starts_at ?? input.date ?? input.created_at ?? null;
	const timestamp =
		timestamp_value != null ? format_timestamp(timestamp_value) : '';

	if (!slug || !timestamp) {
		return input.id ?? 'battle';
	}

	return `${slug}-${timestamp}`;
};

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

	private async resolve_project_directory_handle(
		preferred_name: string,
		legacy_name?: string | null,
		create = false
	): Promise<{ handle: FileSystemDirectoryHandle; name: string } | null> {
		if (!this.synhax_directory_handle) return null;

		try {
			const preferred =
				await this.synhax_directory_handle.getDirectoryHandle(preferred_name);
			return { handle: preferred, name: preferred_name };
		} catch (error) {
			if (legacy_name) {
				try {
					const legacy =
						await this.synhax_directory_handle.getDirectoryHandle(legacy_name);
					return { handle: legacy, name: legacy_name };
				} catch (legacy_error) {
					// fall through
				}
			}
		}

		if (!create) return null;

		try {
			const preferred = await this.synhax_directory_handle.getDirectoryHandle(
				preferred_name,
				{
					create: true
				}
			);
			return { handle: preferred, name: preferred_name };
		} catch (error) {
			return null;
		}
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

	// Get the stored handle from IndexedDB (without requesting permission)
	private async get_stored_handle(): Promise<FileSystemDirectoryHandle | null> {
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
			return handle || null;
		} catch (error) {
			console.warn('Error getting stored handle:', error);
			return null;
		}
	}

	// Check if we already have permission (called on page load, no user gesture needed)
	async check_existing_permission(): Promise<boolean> {
		const handle = await this.get_stored_handle();
		if (!handle) return false;

		try {
			const permission = await handle.queryPermission({ mode: 'readwrite' });

			if (permission === 'granted') {
				// Permission already granted, verify directory is accessible
				try {
					const entries = handle.entries();
					await entries.next(); // Just check if we can iterate

					this.synhax_directory_handle = handle;
					this.set_status('ACCESS');
					return true;
				} catch (accessError) {
					console.warn('Directory no longer accessible:', accessError);
				}
			}
			// If permission is 'prompt' or 'denied', we need user interaction
		} catch (error) {
			console.warn('Error checking permission:', error);
		}
		return false;
	}

	// Request permission (must be called from user gesture like button click)
	async restore_directory_handle(): Promise<boolean> {
		const handle = await this.get_stored_handle();
		if (!handle) {
			// No stored handle, user needs to pick a directory
			await this.setup_synhax_directory();
			return this.status === 'ACCESS';
		}

		try {
			// Request permission - this requires a user gesture
			const permission = await handle.requestPermission({ mode: 'readwrite' });

			if (permission === 'granted') {
				// Verify directory is accessible
				try {
					const entries = handle.entries();
					await entries.next();

					this.synhax_directory_handle = handle;
					this.set_status('ACCESS');
					return true;
				} catch (accessError) {
					console.warn('Directory no longer accessible:', accessError);
					// Directory was deleted or moved, need to pick a new one
					await this.setup_synhax_directory();
					return this.status === 'ACCESS';
				}
			}
		} catch (error) {
			console.warn('Error requesting permission:', error);
		}
		return false;
	}

	async create_hax_directory(
		target_name: string,
		starter_html?: string,
		starter_css?: string,
		legacy_name?: string
	) {
		// Create new directory
		if (!this.synhax_directory_handle) {
			this.set_error('No synhax directory handle available.');
			return;
		}

		const resolved = await this.resolve_project_directory_handle(
			target_name,
			legacy_name,
			true
		);
		if (!resolved) {
			this.set_error('Project folder unavailable.');
			return;
		}

		const project_handle = resolved.handle;
		// HTML - use starter code if provided, otherwise fall back to default template
		const html_file_handle = await project_handle.getFileHandle('index.html', {
			create: true
		});
		const htmlWritable = await html_file_handle.createWritable();
		await htmlWritable.write(starter_html || HTML_TEMPLATE);
		await htmlWritable.close();
		// CSS - use starter code if provided, otherwise fall back to default template
		const css_file_handle = await project_handle.getFileHandle('styles.css', {
			create: true
		});
		const cssWritable = await css_file_handle.createWritable();
		await cssWritable.write(starter_css || CSS_TEMPLATE);
		await cssWritable.close();

		const validation = await validate_and_load_project_files(
			project_handle,
			resolved.name
		);

		if (!validation.success) {
			throw new Error(`Project validation failed: ${resolved.name}`);
		}
		this.project_directory_handle = project_handle;
	}

	// Load current files from target into file state
	async load_hax_directory(target_name: string, legacy_name?: string) {
		if (!this.synhax_directory_handle) {
			this.set_error('No project directory handle available.');
			return;
		}
		try {
			const resolved = await this.resolve_project_directory_handle(
				target_name,
				legacy_name
			);
			if (!resolved) {
				this.set_error('Project folder unavailable.');
				return;
			}

			// Load Project handle
			this.project_directory_handle = resolved.handle;

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

	async read_and_apply_project_files(
		id: string | undefined,
		force: boolean,
		history_context?: HaxHistoryContext
	) {
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

		// Check if HTML file has changed (by mtime)
		const html_changed = force || html_mtime !== this.html_mtime;

		// Check if CSS file has changed (by mtime)
		const css_changed = force || css_mtime !== this.css_mtime;

		if (html_changed) {
			this.html_mtime = html_mtime;
			this.save_html(id, html_text);
		}
		if (css_changed) {
			this.css_mtime = css_mtime;
			this.save_css(id, css_text);
		}

		// Save history if content actually changed (dedup by comparing to current hax content)
		if (history_context && (html_changed || css_changed)) {
			const content_changed =
				html_text !== history_context.current_html ||
				css_text !== history_context.current_css;

			if (content_changed) {
				this.save_history(
					id,
					html_text,
					css_text,
					history_context.battle_starts_at
				);
			}
		}
	}

	async save_html(id: string, text: string) {
		z.mutate(
			mutators.hax.update({
				id,
				user_id: z.userID,
				html: text,
				updated_at: Date.now()
			})
		);
	}

	async save_css(id: string, text: string) {
		z.mutate(
			mutators.hax.update({
				id,
				user_id: z.userID,
				css: text,
				updated_at: Date.now()
			})
		);
	}

	async save_history(
		hax_id: string,
		html: string,
		css: string,
		battle_starts_at: number | null
	) {
		// Calculate elapsed time since battle started
		const elapsed_ms = battle_starts_at ? Date.now() - battle_starts_at : 0;

		// Use elapsed_ms as sequence - it's monotonically increasing and
		// provides natural ordering for playback
		z.mutate(
			mutators.hax_history.insert({
				id: crypto.randomUUID(),
				hax_id,
				html,
				css,
				elapsed_ms,
				sequence: elapsed_ms
			})
		);
	}

	async check() {
		if (typeof window === 'undefined') {
			return;
		}
		// Check to see if handle exists and is valid.
		// Only checks existing permission, does NOT request (no user gesture needed)
		const hasAccess = await this.check_existing_permission();
		if (hasAccess) {
			this.set_status('ACCESS');
		} else {
			this.set_status('NO_ACCESS');
		}
	}
}

export const files = new FileState();
