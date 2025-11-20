import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../utils/db";
import { authenticateJWT, AuthRequest } from "../../middleware/authenticateJWT";

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, _file, cb) {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) return cb(new Error("Unauthorized"), "");
    const uploadPath = path.join(
      __dirname,
      "..",
      "storage",
      "uploads",
      String(userId)
    );
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
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

export default router;
