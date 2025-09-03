# Media Processing Platform

This project is a media processing platform built on Cloudflare Workers that handles both image and video content.

## Services

- **Image Service**: Handles image uploads, storage, and serves optimized images with Cloudflare's image transformations. The endpoint for this service is `https://assets.break-code.com`.
- **Video Service**: Processes video uploads with adaptive bitrate transcoding to HLS format for streaming. The endpoint for this service is `https://videos.break-code.com`.

---

## Security & Production Readiness

### Endpoint Security Matrix

| Service       | Endpoint                     | API Key Required | Client-Safe | Description                                           |
| ------------- | ---------------------------- | ---------------- | ----------- | ----------------------------------------------------- |
| Image Service | `/generate-image-upload-url` | Yes              | No          | Get presigned URL for image upload (server-to-server) |
| Image Service | `/upload`                    | Yes              | No          | Direct image upload (server-to-server only)           |
| Image Service | `/assets/*`                  | No               | Yes         | Serve original images                                 |
| Video Service | `/generate-upload-url`       | Yes              | No          | Get presigned URL for video upload                    |
| Video Service | `/notify-upload-complete`    | Yes              | No          | Notify API to start transcoding job                   |
| Video Service | `/job-status`                | No               | Yes         | Poll transcoding job status                           |
| Video Service | `/playback-url`              | No               | Yes         | Get HLS playback URL                                  |

**Key Points:**

- API keys are only required for sensitive write operations (see table above).
- Presigned URL endpoints for both images and videos are safe for public frontend use and do not require API keys.
- Never expose your API key in the browser for `/upload` or video job notification endpoints.

### API Key Management

API keys are managed via the `IV_API_KEY` environment variable (comma-separated for multiple keys). See `wrangler.toml` for configuration. For single-user/dev, you can hardcode a strong key in your secrets and use it in your UI (for backend/server-to-server calls only).

### Input Validation & Rate Limiting

All endpoints validate `app_id`, `image_id`, `video_id`, and file types/sizes. Invalid or unsupported values will return a 400 error with a clear message.

Sensitive endpoints are rate-limited to 10 requests per minute per IP (demo in-memory). For production, use Cloudflare WAF or Durable Objects for distributed rate limiting.

### Logging, Monitoring & Sentry

All uploads, job starts, and errors are logged. Sentry is integrated for error tracking and alerting in both services.

- For the Cloudflare Workers (`image-service` and `video-service`), set your Sentry DSN in the `IV_SENTRY_DSN` environment variable in `wrangler.toml` (or as a secret).
- For the Node.js transcoder container, use the `TRANS_SENTRY_DSN` environment variable.

Errors and exceptions will be automatically reported to Sentry.

---

### API Key Authentication

All sensitive endpoints (uploads, presigned URL generation, job notification) require an API key via the `x-api-key` header. You must provide a valid `IV_API_KEY` for all write operations.

**For video uploads:**

- The API key is **only required** for the `/generate-upload-url` and `/notify-upload-complete` API calls.
- The actual file upload to R2 (using the presigned URL) does **not** require the API key and is done directly from the browser.

**For image uploads:**

- The API key is required for the `/upload` endpoint (legacy, server-to-server only) and the `/generate-image-upload-url` endpoint. **Do not use these from the browser.**

**Example (video, client + server):**

```js
// Step 1: Get presigned upload URL (API key required, server-side only)
const res = await fetch('https://videos.break-code.com/generate-upload-url', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'x-api-key': 'your-api-key-here' // Only on server
	},
	body: JSON.stringify({
		app_id: 'yourAppId',
		video_id: 'yourVideoId',
		content_type: file.type
	})
});
const { upload_url, raw_key } = await res.json();

// Step 2: Upload file directly to R2 (no API key needed, client-side)
await fetch(upload_url, {
	method: 'PUT',
	headers: { 'Content-Type': file.type },
	body: file
});

// Step 3: Notify API upload is complete (API key required, server-side only)
await fetch('https://videos.break-code.com/notify-upload-complete', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'x-api-key': 'your-api-key-here' // Only on server
	},
	body: JSON.stringify({
		app_id: 'yourAppId',
		video_id: 'yourVideoId',
		raw_key,
		content_type: file.type
	})
});
```

API keys are managed via the `IV_API_KEY` environment variable (comma-separated for multiple keys). See `wrangler.toml` for configuration. For single-user/dev, you can hardcode a strong key in your secrets and use it in your UI.

### Input Validation

All endpoints validate `app_id`, `image_id`, `video_id`, and file types/sizes. Invalid or unsupported values will return a 400 error with a clear message.

### Rate Limiting

Sensitive endpoints are rate-limited to 10 requests per minute per IP (demo in-memory). For production, use Cloudflare WAF or Durable Objects for distributed rate limiting.

### Logging & Monitoring

All uploads, job starts, and errors are logged. For production, Sentry is integrated for error tracking and alerting. Set your Sentry DSN in the `SENTRY_DSN` environment variable in `wrangler.toml`.

---

## Image Service API Usage Guide

This section explains how to use the image processing API for direct uploads and optimized image delivery, matching the actual implementation in the codebase.

### 1. Secure Image Upload Flow (Server-Side URL Generation)

This is the recommended secure flow. It requires a server to get the presigned URL, which is then passed to the client to perform the upload.

#### Step 1: Request a presigned image upload URL (server-side)

Call the `/generate-image-upload-url` endpoint from your backend server, providing your API key:

```js
// This code runs on your trusted server
const res = await fetch('https://assets.break-code.com/generate-image-upload-url', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'x-api-key': 'your-secret-api-key'
	},
	body: JSON.stringify({
		app_id: 'yourAppId',
		image_id: 'yourImageId', // optional, random if omitted
		content_type: 'image/jpeg' // The content type of the file to be uploaded
	})
});
const { upload_url, key, asset_url, transform_url } = await res.json();

// Now, send the `upload_url` and other data to your frontend.
```

#### Step 2: Upload the image file (client-side)

Your frontend receives the `upload_url` from your server and uses it to upload the file directly to R2. No API key is exposed to the client.

```js
// This code runs in the browser
await fetch(upload_url, {
	method: 'PUT',
	headers: { 'Content-Type': 'image/jpeg' }, // Must match the content_type from Step 1
	body: file
});
```

#### Step 3: Use the image in your frontend (client-side)

Use the `asset_url` or `transform_url` (which you also passed from your server) in your UI:

```js
<img src={transform_url} alt="Optimized image" />
```

**Note:**

- The legacy `/upload` endpoint is for server-to-server or trusted backend uploads only and requires an API key.
- The `/upload-direct` endpoint has been removed for security. All uploads must use the secure presigned URL flow.

### 3. Best Practices

- Use unique `image_id` values to avoid collisions.
- Use the `transform_url` for optimized/responsive images in your frontend.
- Cache optimized image URLs on the frontend for performance.

---

## Video Service API Usage Guide

This guide explains how to use the video processing API for direct uploads, job status tracking, error handling, and reprocessing. It includes JavaScript code examples suitable for SvelteKit or any modern frontend.

### 1. Uploading a Video (Presigned URL Flow)

#### Step 1: Request a presigned upload URL

Call the `/generate-upload-url` endpoint with your API key to get a secure, one-time URL for uploading the video file directly to storage.

```js
const res = await fetch('https://videos.break-code.com/generate-upload-url', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'x-api-key': 'your-api-key-here'
	},
	body: JSON.stringify({
		app_id: 'yourAppId',
		video_id: 'yourVideoId',
		content_type: file.type
	})
});
const { upload_url, raw_key } = await res.json();
```

#### Step 2: Upload the file directly to R2

Use the `upload_url` from the previous step to upload the file directly from the browser. This avoids passing large files through your server.

```js
await fetch(upload_url, {
	method: 'PUT',
	headers: { 'Content-Type': file.type },
	body: file
});
```

#### Step 3: Notify the API that the upload is complete

After the upload finishes, notify the API (with your API key) so it can begin the transcoding job.

```js
await fetch('https://videos.break-code.com/notify-upload-complete', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'x-api-key': 'your-api-key-here'
	},
	body: JSON.stringify({
		app_id: 'yourAppId',
		video_id: 'yourVideoId',
		raw_key,
		content_type: file.type
	})
});
```

---

## Sentry Integration

This project uses Sentry for error tracking and alerting in both the image and video services. To enable Sentry:

1. Create a new Sentry project of type **JavaScript (Browser)** for each Worker (image and video).
2. For the Node.js transcoder container, use a **Node.js** Sentry project.
3. Set the DSNs as secrets in your Cloudflare account:
   - `IV_SENTRY_DSN`: For the `image-service` and `video-service` Workers.
   - `TRANS_SENTRY_DSN`: For the `transcode-container`.
4. Errors and exceptions will be automatically reported to Sentry.

For more details, see the Sentry docs for [Cloudflare Workers](https://docs.sentry.io/platforms/javascript/guides/cloudflare-workers/).

---

### 2. Polling for Job Status

After notifying the API, you need to poll the job status endpoint to track the transcoding progress.

```js
async function pollJobStatus(app_id, video_id) {
	const res = await fetch(
		`https://videos.break-code.com/job-status?app_id=${app_id}&video_id=${video_id}`
	);
	const status = await res.json();
	return status;
}

// Example polling loop
let status;
do {
	status = await pollJobStatus('yourAppId', 'yourVideoId');
	// You can show status.status, status.error, etc. in your UI
	if (status.status === 'done' || status.status === 'error') {
		break;
	}
	// Wait 5 seconds before checking again
	await new Promise((r) => setTimeout(r, 5000));
} while (true);
```

---

### 3. Handling Errors, Stuck Jobs, and Reprocessing

- If `status.status === 'error'`, display the `status.error` message to the user and offer a "Retry" button.
- If `status.status === 'processing'` and the `status.heartbeat` timestamp is older than 2–5 minutes, you can consider the job "stuck" and offer a retry option.
- **To retry a job**, simply call the `/notify-upload-complete` endpoint again with the same parameters.

#### Example UI Logic (Pseudo-JS)

```js
function showStatus(status) {
	if (status.status === 'done') {
		// Show the video playback link
	} else if (status.status === 'error') {
		// Show the error message and a retry button
	} else if (status.status === 'processing' && isStale(status.heartbeat)) {
		// Show a "Job is taking longer than expected" message and a retry button
	} else {
		// Show a progress indicator (e.g., spinner)
	}
}

function isStale(heartbeat) {
	if (!heartbeat) return false;
	// Returns true if the heartbeat is older than 5 minutes
	return Date.now() - new Date(heartbeat).getTime() > 5 * 60 * 1000;
}
```

---

### 4. Playback

Once the job status is `done`, you can retrieve the playback URL for the HLS stream.

```js
const res = await fetch(
	`https://videos.break-code.com/playback-url?app_id=yourAppId&video_id=yourVideoId`
);
const { url } = await res.json();
// Use this URL in a video player that supports HLS (e.g., HLS.js, Shaka Player, or a native player).
```

---

### 5. Summary of Endpoints

- `POST https://videos.break-code.com/generate-upload-url` — Get a presigned R2 upload URL.
- `PUT <presigned-url>` — Upload the video file directly to R2 storage.
- `POST https://videos.break-code.com/notify-upload-complete` — Notify the API to queue the transcoding job.
- `GET https://videos.break-code.com/job-status?app_id=...&video_id=...` — Poll for job status.
- `GET https://videos.break-code.com/playback-url?app_id=...&video_id=...` — Get the final HLS playback URL.

---

### 6. Best Practices

- Always poll the job status after notifying the API of a completed upload.
- Handle `error` and `stuck` states gracefully in your UI and allow the user to retry.
- Use a unique `video_id` for each upload to prevent collisions.
- For production environments, consider implementing exponential backoff for polling to reduce server load.
