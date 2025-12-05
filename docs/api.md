# API Documentation

Base URL: `http://localhost:5000/api`

## Endpoints

### 1. Upload Video

Uploads a video file for processing.

- **URL**: `/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
  - `video`: The video file (Required).
  - `title`: Custom title for the video (Optional).

**Success Response (200 OK):**

```json
{
  "success": true,
  "videoId": "60d5ecb8b5c9c62b3c8b4567",
  "message": "Video uploaded. Processing for streaming..."
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "No video file uploaded."
}
```

---

### 2. Get All Videos

Retrieves a list of all processed and ready videos.

- **URL**: `/videos`
- **Method**: `GET`

**Success Response (200 OK):**

```json
[
  {
    "_id": "60d5ecb8b5c9c62b3c8b4567",
    "title": "My Awesome Video",
    "status": "ready",
    "masterPlaylistUrl": "/streams/60d5ecb8b5c9c62b3c8b4567/master.m3u8",
    "createdAt": "2023-10-27T10:00:00.000Z"
  }
]
```

---

### 3. Stream Video

Retrieves streaming information for a specific video.

- **URL**: `/stream/:videoId`
- **Method**: `GET`
- **URL Parameters**:
  - `videoId`: The ID of the video.

**Success Response (200 OK):**

```json
{
  "title": "My Awesome Video",
  "masterPlaylistUrl": "/streams/60d5ecb8b5c9c62b3c8b4567/master.m3u8",
  "qualities": [
    {
      "quality": "360p",
      "playlistUrl": "/streams/60d5ecb8b5c9c62b3c8b4567/360p/playlist.m3u8",
      "bitrate": "800k",
      "resolution": "640x360"
    },
    {
      "quality": "1080p",
      "playlistUrl": "/streams/60d5ecb8b5c9c62b3c8b4567/1080p/playlist.m3u8",
      "bitrate": "4500k",
      "resolution": "1920x1080"
    }
  ]
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Video not available"
}
```
