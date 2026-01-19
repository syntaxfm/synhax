export async function validate_and_load_project_files(
	projectHandle: FileSystemDirectoryHandle,
	projectName: string
) {
	try {
		let htmlHandle = null;
		let cssHandle = null;
		const missingFiles = [];

		// Check for index.html
		try {
			htmlHandle = await projectHandle.getFileHandle('index.html');
		} catch (error) {
			missingFiles.push('index.html');
		}

		// Check for styles.css
		try {
			cssHandle = await projectHandle.getFileHandle('styles.css');
		} catch (error) {
			missingFiles.push('styles.css');
		}

		// Display error if files are missing
		if (missingFiles.length > 0) {
			const errorMessage = `Project "${projectName}" is missing required files: ${missingFiles.join(
				', '
			)}`;
			alert(errorMessage);

			return { success: false, error: errorMessage };
		}

		return { success: true, htmlHandle, cssHandle };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const errorMessage = `Error validating project "${projectName}": ${message}`;
		return { success: false, error: errorMessage };
	}
}
