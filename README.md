# Video Streaming Server

A robust video streaming backend built with Node.js, Express, MongoDB, and FFmpeg. It supports HLS (HTTP Live Streaming) with multiple quality levels.

## Features

- **Video Upload**: Upload video files to the server.
- **Adaptive Bitrate Streaming**: Automatically transcodes videos into HLS format with multiple qualities (360p, 480p, 720p, 1080p).
- **HLS Streaming**: Serves videos using the HLS protocol for smooth playback.
- **Modular Architecture**: Clean MVC structure with ES Modules.

## Prerequisites

- Node.js (v14+)
- MongoDB
- FFmpeg (handled by `@ffmpeg-installer/ffmpeg` but system installation recommended for production)

## Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root directory:
    ```env
    MONGO_URI=mongodb://localhost:27017/video-streaming
    PORT=5000
    ```

## Usage

1.  Start the server:
    ```bash
    npm run dev
    ```
2.  The server will run on `http://localhost:5000`.

## API Endpoints

### Upload Video

- **URL**: `/api/upload`
- **Method**: `POST`
- **Body**: `form-data` with key `video` (file)
- **Response**: JSON with video ID and processing status.

### Get All Videos

- **URL**: `/api/videos`
- **Method**: `GET`
- **Response**: List of available videos.

### Stream Video

- **URL**: `/api/stream/:videoId`
- **Method**: `GET`
- **Response**: Master playlist URL and quality options.

## Documentation

- [System Architecture](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Video Processing Workflow](docs/workflow.md)

## Project Structure

- `src/config`: Configuration files (DB, Multer).
- `src/controllers`: Request handlers.
- `src/models`: Mongoose models.
- `src/routes`: API route definitions.
- `src/utils`: Helper functions (Video processing).
- `src/server.js`: Main application entry point.
