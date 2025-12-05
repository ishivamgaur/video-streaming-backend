import mongoose from "mongoose";

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

export default mongoose.model("Video", videoSchema);
