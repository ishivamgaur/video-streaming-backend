import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import videoRoutes from "./routes/videoRoutes.js";

dotenv.config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve HLS files
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

// Routes
app.use("/api", videoRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Streaming server running on port ${PORT}`));
