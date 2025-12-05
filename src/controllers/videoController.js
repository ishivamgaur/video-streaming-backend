import Video from "../models/Video.js";
import { processVideoForStreaming } from "../utils/videoProcessor.js";

export const uploadVideo = async (req, res) => {
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
};

export const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find({ status: "ready" }).sort({
      createdAt: -1,
    });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const streamVideo = async (req, res) => {
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
};
