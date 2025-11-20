import { Router, Request, Response } from "express";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// --- Import or create your DB pool (mysql2/promise)
import { pool } from "../utils/db.js";

// Config
const YOLO_URL = process.env.YOLO_URL || "http://yolo:8000/detect";
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "storage", "uploads");
const ANNOTATED_DIR = path.join(UPLOADS_DIR, "annotated");
const DETECTION_CALL_RETRIES = 3;
const DETECTION_TIMEOUT_MS = 120000; // 2 minutes

// Ensure annotated dir exists
fs.mkdirSync(ANNOTATED_DIR, { recursive: true });

type Detection = {
  class: string;
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
};

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
  if (!imageId || isNaN(imageId)) return res.status(400).json({ error: "invalid image id" });

  try {
    // 1) Load image path from DB
    const [rows] = await pool.query("SELECT id, user_id, filename, path, annotated_path FROM images WHERE id = ?", [imageId]);
    const imageRecord: any = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!imageRecord) {
      return res.status(404).json({ error: "image not found" });
    }

    const imagePath = imageRecord.path; // should be full local path or relative to UPLOADS_DIR
    // If your DB stores relative path, build full path:
    const resolvedImagePath = path.isAbsolute(imagePath) ? imagePath : path.join(UPLOADS_DIR, imagePath);

    if (!fs.existsSync(resolvedImagePath)) {
      return res.status(500).json({ error: "image file not found on disk", path: resolvedImagePath });
    }

    // 2) Send image to YOLO service with retries
    let yoloRespData: { annotated_image_base64?: string; detections?: Detection[] } | null = null;
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
          yoloRespData = resp.data;
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
      return res.status(502).json({ error: "YOLO service failed", details: String(lastErr) });
    }

    const annotatedBase64 = yoloRespData.annotated_image_base64;
    const detections: Detection[] = Array.isArray(yoloRespData.detections) ? yoloRespData.detections : [];

    // 3) Save annotated image to disk
    let annotatedFilename = null;
    if (annotatedBase64) {
      // annotatedBase64 might include data url prefix, strip it
      const matches = annotatedBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      let base64Data = annotatedBase64;
      let ext = "jpg";
      if (matches && matches.length === 3) {
        base64Data = matches[2];
        const mime = matches[1];
        ext = mime.split("/")[1] || "jpg";
      }

      const buf = Buffer.from(base64Data, "base64");
      annotatedFilename = `annotated-${imageId}-${uuidv4()}.${ext}`;
      const annotatedFilePath = path.join(ANNOTATED_DIR, annotatedFilename);
      fs.writeFileSync(annotatedFilePath, buf);
      // Optionally set permissions, etc.

      // Update images.annotated_path (if you have such column)
      await pool.query("UPDATE images SET annotated_path = ? WHERE id = ?", [path.join("annotated", annotatedFilename), imageId]);
    }

    // 4) Insert detections into detections table in a transaction
    try {
      await pool.beginTransaction();

      // Optionally delete old detections for this image
      await pool.query("DELETE FROM detections WHERE image_id = ?", [imageId]);

      if (detections.length) {
        const insertSql = `INSERT INTO detections (image_id, class_name, x, y, w, h, confidence, created_at) VALUES ?`;
        const values = detections.map((d) => [
          imageId,
          d.class,
          d.x,
          d.y,
          d.w,
          d.h,
          d.confidence,
          new Date(),
        ]);
        await pool.query(insertSql, [values]);
      }

      await pool.commit();
    } catch (dbErr) {
      await pool.rollback();
      console.error("DB error inserting detections:", dbErr);
      return res.status(500).json({ error: "DB error inserting detections", details: String(dbErr) });
    }

    // 5) Return structured response
    const annotatedUrl = annotatedFilename ? `/uploads/annotated/${annotatedFilename}` : null; // adjust to your static serve path
    res.json({
      image_id: imageId,
      annotated_url: annotatedUrl,
      detections,
    });
  } catch (err) {
    console.error("Detect route error:", err);
    res.status(500).json({ error: "internal error", details: String(err) });
  }

});

export default router;
