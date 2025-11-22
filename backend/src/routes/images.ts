import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// @ts-ignore: missing type declarations for ../utils/db
import { pool } from "../utils/db.js";
import { authenticateJWT, AuthRequest } from "../middleware/authenticateJWT.js";
import { UPLOAD_ROOT } from "../config/storage.js";

const router = Router();

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

// Upload route
router.post(
  "/upload",
  authenticateJWT,
  upload.single("image"),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const filename = req.file!.filename;
      const relativePath = `/uploads/${userId}/${filename}`;

      const [result] = await pool.query(
        "INSERT INTO images (user_id, filename, path, created_at) VALUES (?, ?, ?, NOW())",
        [userId, filename, relativePath]
      );

      res.json({ id: (result as any).insertId, url: relativePath });
    } catch (err: any) {
      res.status(500).json({ error: "Upload failed", details: err.message });
    }
  }
);

// Serve image route
router.get("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query("SELECT * FROM images WHERE id = ?", [
      req.params.id,
    ]);
    const image = (rows as any)[0];
    if (!image) return res.status(404).json({ error: "Image not found" });
    if (image.user_id !== req.user!.userId)
      return res.status(403).json({ error: "Not authorized" });

    const filePath = path.join(
      UPLOAD_ROOT,
      String(image.user_id),
      image.filename
    );
    console.log("🚀 ~ filePath:", filePath)
    if (!fs.existsSync(filePath))
      return res.status(404).json({ error: "File missing" });

    res.sendFile(filePath);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to serve image", details: err.message });
  }
});

export default router;
