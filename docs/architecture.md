# System Architecture

The Video Streaming Server follows a modular **MVC (Model-View-Controller)** architecture, adapted for an API-first backend (no Views, just JSON responses).

## Directory Structure

```
src/
├── config/         # Configuration files
│   ├── db.js       # Database connection logic
│   └── multer.js   # File upload configuration
├── controllers/    # Request handlers
│   └── videoController.js
├── models/         # Database models
│   └── Video.js    # Mongoose schema for Videos
├── routes/         # API route definitions
│   └── videoRoutes.js
├── utils/          # Helper functions
│   └── videoProcessor.js # FFmpeg processing logic
└── server.js       # Entry point
```

## Key Components

### 1. Server Entry Point (`server.js`)

- Initializes the Express application.
- Connects to MongoDB.
- Sets up middleware (CORS, JSON parsing).
- Serves static files for HLS streaming (`/streams`).
- Mounts API routes.

### 2. Database Layer (`models/`)

- Uses **Mongoose** to interact with MongoDB.
- **Video Model**: Stores metadata about uploaded videos, including:
  - Title and original filename.
  - Processing status (`processing`, `ready`, `error`).
  - HLS playlist URLs for different qualities.
  - Master playlist URL.

### 3. Controller Layer (`controllers/`)

- Handles incoming HTTP requests.
- Validates input.
- Interacts with the Model layer.
- Triggers background processing tasks.
- Sends JSON responses.

### 4. Routing Layer (`routes/`)

- Maps HTTP methods and URLs to specific controller functions.
- Decouples routing logic from the main application file.

### 5. Utility Layer (`utils/`)

- Contains reusable logic independent of the HTTP layer.
- **Video Processor**: Handles the complex task of transcoding video files using FFmpeg.
