import express from "express";
import upload from "../config/multer.js";
import {
  uploadVideo,
  getAllVideos,
  streamVideo,
} from "../controllers/videoController.js";

const router = express.Router();

router.post("/upload", upload.single("video"), uploadVideo);
router.get("/videos", getAllVideos);
router.get("/stream/:videoId", streamVideo);

export default router;
