# Video Processing Workflow

This document explains how a raw video file uploaded by a user is transformed into an adaptive bitrate HLS stream.

## Workflow Steps

### 1. Upload

- User sends a `POST` request to `/api/upload` with a video file.
- **Multer** middleware intercepts the request and saves the raw file to a temporary location (`src/uploads/`).
- A new `Video` document is created in MongoDB with status `processing`.
- The HTTP response is sent immediately, acknowledging the upload.

### 2. Background Processing

- The `processVideoForStreaming` function (in `src/utils/videoProcessor.js`) is called asynchronously. It does **not** block the HTTP response.
- This function takes the path of the uploaded file and the video ID.

### 3. Transcoding (FFmpeg)

- The system defines multiple quality profiles:
  - **360p**: 640x360, 800k bitrate
  - **480p**: 854x480, 1200k bitrate
  - **720p**: 1280x720, 2500k bitrate
  - **1080p**: 1920x1080, 4500k bitrate
- For each quality profile, **FFmpeg** is invoked to:
  - Resize the video.
  - Adjust the bitrate.
  - Segment the video into small chunks (`.ts` files).
  - Generate a playlist (`.m3u8`) for that specific quality.

### 4. Master Playlist Generation

- After all qualities are generated, a **Master Playlist** (`master.m3u8`) is created.
- This file references all the individual quality playlists.
- The player uses this master playlist to automatically switch between qualities based on the user's internet speed (Adaptive Bitrate Streaming).

### 5. Finalization

- The `Video` document in MongoDB is updated:
  - `status` is set to `ready`.
  - `masterPlaylistUrl` and `qualities` fields are populated.
- The original raw video file is deleted from `src/uploads/` to save space.

## Error Handling

- If any step of the transcoding fails, the `catch` block catches the error.
- The `Video` document status is updated to `error`.
- Error details are logged to the console.
