import { Router, Request, Response } from "express";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { authenticateJWT, AuthRequest } from "../middleware/authenticateJWT.js";
import multer from "multer";
// @ts-ignore: missing type declarations for ../utils/db
import { pool } from "../utils/db.js";
import { UPLOAD_ROOT } from "../config/storage.js";

const router = Router();

// Configuration
const YOLO_URL = process.env.YOLO_URL || "http://yolo:8000/detect";
const UPLOADS_DIR =
  process.env.UPLOADS_DIR || path.join(process.cwd(), "storage", "uploads");
const ANNOTATED_DIR = path.join(UPLOADS_DIR, "annotated");
const DETECTION_CALL_RETRIES = 3;
const DETECTION_TIMEOUT_MS = 120000; // 2 minutes

// Ensure annotated directory exists
fs.mkdirSync(ANNOTATED_DIR, { recursive: true });

// Type definitions
interface Detection {
  class: string;
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
}

interface YoloResponse {
  annotated_image_base64?: string;
  detections?: Detection[];
  image_id?: string;
}

interface ImageRecord {
  id: number;
  user_id: number;
  filename: string;
  path: string;
  annotated_path?: string;
}

// Helper: simple delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * POST /api/images/:id/detect
 * - loads image path from DB (images table)
 * - sends it to YOLO service
 * - saves annotated image and insert detections into DB
 */
router.post("/:id/detect", async (req: Request, res: Response) => {
  const imageId = Number(req.params.id);
  if (!imageId || isNaN(imageId))
    return res.status(400).json({ error: "invalid image id" });

  try {
    // 1) Load image path from DB
    const [rows] = await pool.query(
      "SELECT id, user_id, filename, path, annotated_path FROM images WHERE id = ?",
      [imageId]
    );
    const imageRecord =
      Array.isArray(rows) && rows.length ? (rows[0] as ImageRecord) : null;
    if (!imageRecord) {
      return res.status(404).json({ error: "image not found" });
    }

    const imagePath = imageRecord.path; // should be full local path or relative to UPLOADS_DIR
    // If your DB stores relative path, build full path:
    const resolvedImagePath = path.isAbsolute(imagePath)
      ? imagePath
      : path.join(UPLOADS_DIR, imagePath);

    if (!fs.existsSync(resolvedImagePath)) {
      return res
        .status(500)
        .json({
          error: "image file not found on disk",
          path: resolvedImagePath,
        });
    }

    // 2) Send image to YOLO service with retries
    let yoloRespData: YoloResponse | null = null;
    let lastErr: any = null;

    for (let attempt = 1; attempt <= DETECTION_CALL_RETRIES; attempt++) {
      try {
        const form = new FormData();
        form.append("image", fs.createReadStream(resolvedImagePath), {
          filename: path.basename(resolvedImagePath),
        });
        // Optionally add metadata
        form.append("image_id", String(imageId));

        const headers = form.getHeaders();

        const resp = await axios.post(YOLO_URL, form, {
          headers,
          timeout: DETECTION_TIMEOUT_MS,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

        if (resp.status >= 200 && resp.status < 300) {
          yoloRespData = resp.data as YoloResponse;
          break;
        } else {
          lastErr = new Error(`YOLO returned status ${resp.status}`);
        }
      } catch (err) {
        lastErr = err;
        // simple exponential backoff
        const backoffMs = 1000 * attempt;
        await delay(backoffMs);
      }
    }

    if (!yoloRespData) {
      console.error("YOLO call failed:", lastErr);
      return res
        .status(502)
        .json({ error: "YOLO service failed", details: String(lastErr) });
    }

    // 3) Save annotated image from base64 response
    const { annotated_image_base64, detections } = yoloRespData;
    let annotatedImagePath: string | null = null;

    if (annotated_image_base64) {
      const base64Data = annotated_image_base64.replace(
        /^data:image\/png;base64,/,
        ""
      );
      const annotatedFilename = `annotated_${uuidv4()}.png`;
      annotatedImagePath = path.join(ANNOTATED_DIR, annotatedFilename);

      fs.writeFileSync(annotatedImagePath, base64Data, "base64");

      // Update DB with annotated path
      await pool.query("UPDATE images SET annotated_path = ? WHERE id = ?", [
        path.relative(UPLOADS_DIR, annotatedImagePath), // store relative path
        imageId,
      ]);
    }

    // 4) Insert detection records into DB
    if (detections && detections.length > 0) {
      const detectionValues = detections.map((det) => [
        imageId,
        det.class,
        det.x,
        det.y,
        det.w,
        det.h,
        det.confidence,
      ]);

      await pool.query(
        `INSERT INTO detections (image_id, class_name, x, y, w, h, confidence) VALUES ?`,
        [detectionValues]
      );
    }

    // 5) Return response
    res.json({
      success: true,
      message: "Detection completed",
      data: {
        imageId,
        detections: detections || [],
        detectionCount: detections ? detections.length : 0,
        annotatedPath: annotatedImagePath
          ? path.relative(UPLOADS_DIR, annotatedImagePath)
          : null,
      },
    });
  } catch (error) {
    console.error("Detection error:", error);
    res.status(500).json({ error: "Detection failed" });
  }
});

/**
 * GET /api/images/:id/detections
 * Get detection results for a specific image
 */
router.get("/:id/detections", async (req: Request, res: Response) => {
  try {
    const imageId = Number(req.params.id);
    if (!imageId || isNaN(imageId)) {
      return res.status(400).json({ error: "Invalid image ID" });
    }

    // Verify image exists and belongs to user
    const [imageRows] = (await pool.query(
      "SELECT id, user_id, filename, path, annotated_path FROM images WHERE id = ? AND user_id = ?",
      [imageId, (req as any).user.id] // Assuming auth middleware sets req.user
    )) as any;

    if (!Array.isArray(imageRows) || imageRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Image not found or access denied" });
    }

    // Get detections
    const [detectionRows] = await pool.query(
      "SELECT id, class_name, x, y, w, h, confidence, created_at FROM detections WHERE image_id = ? ORDER BY confidence DESC",
      [imageId]
    );

    res.json({
      success: true,
      data: {
        image: (imageRows as any)[0],
        detections: detectionRows as Detection[],
      },
    });
  } catch (error) {
    console.error("Error getting detections:", error);
    res.status(500).json({ error: "Failed to get detections", details: error });
  }
});

/**
 * GET /api/images/user/:userId/detection-summary
 * Get summary of all detections for a user
 */
router.get(
  "/user/:userId/detection-summary",
  async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Get detection summary
      const [summaryRows] = await pool.query(
        `SELECT 
        d.class_name,
        COUNT(*) as detection_count,
        AVG(d.confidence) as avg_confidence,
        MAX(d.confidence) as max_confidence
      FROM detections d
      JOIN images i ON d.image_id = i.id
      WHERE i.user_id = ?
      GROUP BY d.class_name
      ORDER BY detection_count DESC`,
        [userId]
      );

      // Get recent detections
      const [recentRows] = await pool.query(
        `SELECT 
        d.*,
        i.filename,
        i.created_at as image_created_at
      FROM detections d
      JOIN images i ON d.image_id = i.id
      WHERE i.user_id = ?
      ORDER BY d.created_at DESC
      LIMIT 20`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          summary: summaryRows,
          recent: recentRows,
        },
      });
    } catch (error) {
      console.error("Error getting detection summary:", error);
      res
        .status(500)
        .json({ error: "Failed to get detection summary", details: error });
    }
  }
);

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, _file, cb) {
    const userId = (req as AuthRequest).user?.userId;
    const userPath = path.join(UPLOAD_ROOT, String(userId));
    fs.mkdirSync(userPath, { recursive: true });
    cb(null, userPath);
  },
  filename: function (_req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// File filter
function fileFilter(
  _req: AuthRequest,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const allowed = ["image/jpeg", "image/png"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPEG/PNG images allowed"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * POST /api/images/upload-and-detect
 * Combined endpoint for uploading image and running detection
 */
router.post(
  "/upload-and-detect",
  authenticateJWT,
  upload.single("image"),
  async (req: AuthRequest, res: Response) => {
    try {
      // This would integrate with your existing upload middleware
      // For now, assuming the image is already uploaded and available as req.file

      const userId = req.user!.userId;
      console.log("🚀 ~ userId:", userId)
      const filename = req.file!.filename;
      console.log("🚀 ~ filename:", filename)
      const relativePath = `/uploads/${userId}/${filename}`;
      console.log("🚀 ~ relativePath:", relativePath)

      // if (filename === undefined) {
      //   return res.status(400).json({ error: "No image file provided" });
      // }

      const [result] = await pool.query(
        "INSERT INTO images (user_id, filename, path, created_at) VALUES (?, ?, ?, NOW())",
        [userId, filename, relativePath]
      );

      // res.json({ id: (result as any).insertId, url: relativePath });

      const imageId = (result as any).insertId; // Assuming upload middleware sets this

      // Call the detect endpoint internally
      const detectResponse = await axios.post(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL || 3300
        }/api/images/${imageId}/detect`,
        {},
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );

      res.json(detectResponse.data);
    } catch (error) {
      console.error("Upload and detect error:", error);
      res
        .status(500)
        .json({ error: "Upload and detection failed", details: error });
    }
  }
);

export default router;
