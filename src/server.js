// backend/server.js
const express = require("express");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
const fs = require("fs-extra");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

// Point fluent-ffmpeg to the installed binaries
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const app = express();
app.use(express.json()); // Serve HLS files
// Enable CORS for all routes and origins
app.use(cors());

app.use(
  "/streams",
  express.static("streams", {
    setHeaders: (res, path) => {
      // Set proper headers for HLS
      if (path.endsWith(".m3u8")) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      } else if (path.endsWith(".ts")) {
        res.setHeader("Content-Type", "video/MP2T");
      }
    },
  })
);

// Video Schema
const videoSchema = new mongoose.Schema({
  title: String,
  originalName: String,
  status: {
    type: String,
    enum: ["processing", "ready", "error"],
    default: "processing",
  },
  qualities: [
    {
      quality: String, // '360p', '720p', '1080p'
      playlistUrl: String,
      bitrate: String,
    },
  ],
  masterPlaylistUrl: String,
  duration: Number,
  createdAt: { type: Date, default: Date.now },
});

const Video = mongoose.model("Video", videoSchema);

// Upload endpoint
const multer = require("multer");
const connectDB = require("./config/db");
const upload = multer({ dest: "src/uploads/" });

app.post("/api/upload", upload.single("video"), async (req, res) => {
  try {
    // Add validation to ensure a file is uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded." });
    }

    const video = new Video({
      title: req.body.title || req.file.originalname,
      originalName: req.file.originalname,
    });
    await video.save();

    // Process video in background (don't wait)
    processVideoForStreaming(req.file.path, video._id);

    res.json({
      success: true,
      videoId: video._id,
      message: "Video uploaded. Processing for streaming...",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Video processing function
async function processVideoForStreaming(inputPath, videoId) {
  try {
    const outputDir = path.join("streams", videoId.toString());
    await fs.ensureDir(outputDir);

    // Create multiple quality levels
    const qualities = [
      { name: "360p", resolution: "640x360", bitrate: "800k", audio: "96k" },
      { name: "480p", resolution: "854x480", bitrate: "1200k", audio: "128k" },
      { name: "720p", resolution: "1280x720", bitrate: "2500k", audio: "128k" },
      {
        name: "1080p",
        resolution: "1920x1080",
        bitrate: "4500k",
        audio: "192k",
      },
    ];

    const qualityPlaylists = [];

    // Generate each quality level
    for (const quality of qualities) {
      const qualityDir = path.join(outputDir, quality.name);
      await fs.ensureDir(qualityDir);

      const playlistPath = await generateHLSPlaylist(
        inputPath,
        qualityDir,
        quality
      );

      qualityPlaylists.push({
        quality: quality.name,
        playlistUrl: `/streams/${videoId}/${quality.name}/playlist.m3u8`,
        bitrate: quality.bitrate,
        resolution: quality.resolution,
      });
    }

    // Create master playlist
    await createMasterPlaylist(outputDir, qualityPlaylists);

    // Update video status
    await Video.findByIdAndUpdate(videoId, {
      status: "ready",
      qualities: qualityPlaylists,
      masterPlaylistUrl: `/streams/${videoId}/master.m3u8`,
    });

    // Cleanup original file
    await fs.remove(inputPath);

    console.log(`Video ${videoId} processing completed`);
  } catch (error) {
    console.error("Processing error:", error);
    await Video.findByIdAndUpdate(videoId, { status: "error" });
  }
}

// Generate HLS playlist for a specific quality
function generateHLSPlaylist(inputPath, outputDir, quality) {
  return new Promise((resolve, reject) => {
    const playlistPath = path.join(outputDir, "playlist.m3u8");

    ffmpeg(inputPath)
      .outputOptions([
        // Video settings
        `-vf scale=${quality.resolution}`,
        `-b:v ${quality.bitrate}`,
        "-c:v h264",
        "-profile:v main",
        "-crf 20",
        "-maxrate 800k",
        "-bufsize 1200k",

        // Audio settings
        `-b:a ${quality.audio}`,
        "-ac 2",
        "-c:a aac",

        // HLS settings
        "-hls_time 6", // 6-second chunks
        "-hls_list_size 0", // Keep all segments
        "-hls_segment_filename",
        path.join(outputDir, "segment%03d.ts"),
        "-f hls",
      ])
      .output(playlistPath)
      .on("end", () => resolve(playlistPath))
      .on("error", reject)
      .run();
  });
}

// Create master playlist
async function createMasterPlaylist(outputDir, qualities) {
  const masterContent = ["#EXTM3U", "#EXT-X-VERSION:3"];

  qualities.forEach((quality) => {
    const bandwidth = parseInt(quality.bitrate) * 1000; // Convert to bits
    masterContent.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.resolution},CODECS="avc1.42e01f,mp4a.40.2"`,
      `${quality.quality}/playlist.m3u8`
    );
  });

  await fs.writeFile(
    path.join(outputDir, "master.m3u8"),
    masterContent.join("\n")
  );
}

// Get video stream URL
app.get("/api/stream/:videoId", async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video || video.status !== "ready") {
      return res.status(404).json({ error: "Video not available" });
    }

    res.json({
      masterPlaylist: video.masterPlaylistUrl,
      qualities: video.qualities,
      title: video.title,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all videos
app.get("/api/videos", async (req, res) => {
  try {
    const videos = await Video.find({ status: "ready" }).sort({
      createdAt: -1,
    });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() =>
    app.listen(PORT, () => console.log(`Streaming server running on port ${PORT}`))
  )
  .catch((err) => {
    console.error("Failed to connect to database:", err);
  });
