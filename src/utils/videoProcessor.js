import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import fs from "fs-extra";
import path from "path";
import Video from "../models/Video.js";

// Point fluent-ffmpeg to the installed binaries
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// Video processing function
export async function processVideoForStreaming(inputPath, videoId) {
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
      { name: "2160p", resolution: "3840x2160", bitrate: "6500k", audio: "192k" },
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
