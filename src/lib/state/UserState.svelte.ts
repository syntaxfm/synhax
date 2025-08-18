type Project = {
	// Project name
	name: string;
	// Project directory handle
	handle: FileSystemDirectoryHandle;
};

type File = {
	modified: number;
	handle: FileSystemFileHandle | null;
	text: string;
};

export class UserState {
	status:
		| 'INITIAL'
		| 'INITIALIZING'
		| 'NO_ACCESS'
		| 'READY'
		| 'ERROR'
		| 'SCANNING'
		| 'PROJECT_LOADING'
		| 'PROJECT' = $state('INITIAL');
	error = $state('');
	directory: number = $state(0);
	projects: Project[] = $state([]);
	synhax_directory_handle: FileSystemDirectoryHandle | null = $state(null);
	active_project:
		| (Project & {
				html: File;
				css: File;
		  })
		| null = $state(null);
	app_frame: HTMLIFrameElement | null = $state(null);
	poll_timer: number | null = $state(null);

	constructor() {}

	private set_status(status: UserState['status']) {
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
				id: 'synhax-directory-svelte',
				startIn: 'documents'
			});
			console.log(this.synhax_directory_handle);
			if (this.synhax_directory_handle) {
				// Save for persistence
				await this.save_directory_handle(this.synhax_directory_handle);

				// Scan for existing projects and display them
				await this.scan_and_display_projects();

				this.set_status('READY');
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

	// Scan ~/.synhax directory for existing projects
	async scan_and_display_projects() {
		if (!this.synhax_directory_handle) return;

		this.set_status('SCANNING');

		try {
			this.projects = [];

			// Iterate through directory entries
			for await (const [name, handle] of this.synhax_directory_handle.entries()) {
				if (handle.kind === 'directory') {
					// Check if this directory contains index.html and styles.css
					const hasRequiredFiles = await this.check_project_files(handle);
					if (hasRequiredFiles) {
						this.projects.push({ name, handle });
					}
				}
			}
		} catch (error) {
			console.error('Error scanning projects:', error);
			this.set_error('Error scanning projects');
		}
	}

	// Check if a directory contains required project files and get file handles
	async check_project_files(directoryHandle: FileSystemDirectoryHandle) {
		try {
			const hasIndexHtml = await directoryHandle
				.getFileHandle('index.html')
				.then(() => true)
				.catch(() => false);
			const hasStylesCss = await directoryHandle
				.getFileHandle('styles.css')
				.then(() => true)
				.catch(() => false);
			return hasIndexHtml && hasStylesCss;
		} catch (error) {
			return false;
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

			const handle: FileSystemDirectoryHandle = await new Promise((resolve, reject) => {
				const request = store.get('directory');
				request.onerror = () => reject(request.error);
				request.onsuccess = () => resolve(request.result);
			});

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
							await this.scan_and_display_projects();
							this.set_status('READY');
							return true;
						} catch (accessError) {
							console.warn('Directory no longer accessible:', accessError);
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

	async load_project(project: Project) {
		try {
			// Load project from directory handle
			if (this.synhax_directory_handle) {
				await this.synhax_directory_handle.requestPermission({ mode: 'readwrite' });

				this.set_status('PROJECT_LOADING');
				this.active_project = {
					...project,
					html: { modified: 0, handle: null, text: '' },
					css: { modified: 0, handle: null, text: '' }
				};

				const validation = await this.validate_and_load_project_files(project.handle, project.name);

				// If validation fails, bounce out
				if (!validation.success) {
					return;
				}

				this.save_current_project(project.name);

				// Reset Last Mod
				this.reset_last_mod();

				// Load initial file contents
				await this.read_and_apply_project_files(true);

				// Monitor local files for change
				this.start_polling();
			}
		} catch (error) {
			console.error('Error loading project:', error);
			this.set_error(`Error loading project ${this.active_project?.name}: ${error.message}`);
			this.active_project = null;
			this.stop_polling();
		}
	}

	async validate_and_load_project_files(handle: FileSystemDirectoryHandle, name: string) {
		try {
			let htmlHandle = null;
			let cssHandle = null;
			const missingFiles = [];

			// Check for index.html
			try {
				htmlHandle = await handle.getFileHandle('index.html');
			} catch (error) {
				missingFiles.push('index.html');
			}

			// Check for styles.css
			try {
				cssHandle = await handle.getFileHandle('styles.css');
			} catch (error) {
				missingFiles.push('styles.css');
			}

			// Display error if files are missing
			if (missingFiles.length > 0) {
				const errorMessage = `Project "${name}" is missing required files: ${missingFiles.join(
					', '
				)}`;
				alert(errorMessage);
				this.set_error('Project validation failed');
				return { success: false, error: errorMessage };
			}

			// All files found - store the handles
			if (this.active_project && htmlHandle && cssHandle) {
				this.active_project.html.handle = htmlHandle;
				this.active_project.css.handle = cssHandle;
			}

			this.set_status('PROJECT');
			return { success: true, htmlHandle, cssHandle };
		} catch (error) {
			const errorMessage = `Error validating project "${name}": ${error.message}`;
			alert(errorMessage);
			this.set_error('Project validation error');
			return { success: false, error: errorMessage };
		}
	}
	async save_current_project(name: string) {
		// TODO
	}
	async read_and_apply_project_files(force: boolean) {
		if (!this.active_project || !this.active_project.css.handle || !this.active_project.html.handle)
			return;

		try {
			const { html_text, css_text, html_mtime, css_mtime } = await this.read_project_files();
			// Check if HTML file has changed
			const html_changed = force || html_mtime !== this.active_project.html.modified;
			// Check if CSS file has changed
			const css_changed = force || css_mtime !== this.active_project.css.modified;

			// Update HTML textarea if file changed
			if (html_changed && html_text !== this.active_project.html.text) {
				this.active_project.html.text = html_text;
				this.active_project.html.modified = html_mtime;
			}

			// Update CSS textarea if file changed
			if (css_changed && css_text !== this.active_project.css.text) {
				this.active_project.css.text = css_text;
				this.active_project.css.modified = css_mtime;
			}

			// Refresh iframe if either file changed
			if (html_changed || css_changed) {
				this.refresh_iframe();
			}
		} catch (error) {
			console.error('Error reading project files:', error);
			this.set_error(`Error reading project files: ${error.message}`);
		}
	}

	async read_project_files() {
		if (!this.active_project?.html.handle || !this.active_project.css.handle) {
			return { html_text: '', css_text: '', html_mtime: 0, css_mtime: 0 };
		}

		try {
			// Read HTML file
			const html_file = await this.active_project.html.handle.getFile();
			const html_text = await html_file.text();
			const html_mtime = html_file.lastModified;

			// Read CSS file
			const css_file = await this.active_project.css.handle.getFile();
			const css_text = await css_file.text();
			const css_mtime = css_file.lastModified;

			return { html_text, css_text, html_mtime, css_mtime };
		} catch (error) {
			console.error('Error reading project files:', error);
			this.set_error('File read error');
			return { html_text: '', css_text: '', html_mtime: 0, css_mtime: 0 };
		}
	}

	async start_polling() {
		this.stop_polling();
		this.poll_timer = setInterval(() => this.read_and_apply_project_files(false), 400);
	}
	async stop_polling() {
		if (this.poll_timer) clearInterval(this.poll_timer);
		this.poll_timer = null;
	}

	async refresh_iframe() {
		if (!this.active_project?.html.handle || !this.active_project.css.handle) {
			return;
		}
		if (!this.app_frame) return;
		// Get both files
		const html_file = await this.active_project.html.handle.getFile();
		const css_file = await this.active_project.css.handle.getFile();

		let html_text = await html_file.text();
		const css_text = await css_file.text();

		const css_blob = new Blob([css_text], { type: 'text/css' });
		const css_url = URL.createObjectURL(css_blob);

		// Replace the CSS link in HTML to use the blob URL
		html_text = html_text.replace(/href\s*=\s*["']styles\.css["']/gi, `href="${css_url}"`);

		// Create HTML blob with updated CSS link
		const html_blob = new Blob([html_text], { type: 'text/html' });
		const html_url = URL.createObjectURL(html_blob);

		// Load the HTML in iframe
		this.app_frame.src = html_url;

		// Clean up URLs after iframe loads
		this.app_frame.addEventListener(
			'load',
			() => {
				URL.revokeObjectURL(html_url);
				URL.revokeObjectURL(css_url);
			},
			{ once: true }
		);
	}

	async reset_last_mod() {
		if (this.active_project) {
			this.active_project.html.modified = 0;
			this.active_project.css.modified = 0;
		}
	}

	async setup_user() {
		// Check if dir is already setup.
		this.set_status('INITIALIZING');

		// Check to see if handle exists and is valid.
		// Try to restore directory handle
		const restored = await this.restore_directory_handle();
		if (restored) {
			this.set_status('READY');
		} else {
			this.set_status('NO_ACCESS');
		}
	}
}
