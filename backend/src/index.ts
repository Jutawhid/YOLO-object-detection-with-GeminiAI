import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import authRoutes from "./routes/auth.js";
import imageRouteres from "./routes/images.js";
import imageDetedctRoutes from "./routes/detect.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.BACKEND_LOG_LEVEL || "dev"));

// Auth routes
app.use("/api/auth", authRoutes);

// Image routes
app.use("/api/image", imageRouteres);

// Image detection routes
app.use("/api/images", imageDetedctRoutes);

const PORT = Number(process.env.BACKEND_PORT || 3300);

// Optional: load CA if provided
let sslConfig: any = { rejectUnauthorized: false };
/*
import fs from "fs";
const caPath = process.env.TIDB_CA_PATH;
if (caPath) {
  sslConfig = { ca: fs.readFileSync(caPath) };
}
*/

const DB_CONFIG = {
  host: process.env.MYSQL_HOST || "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
  port: Number(process.env.MYSQL_PORT || 4000),
  user: process.env.MYSQL_USER || "4MfksbhhXKxyiow.root",
  password: process.env.MYSQL_PASSWORD || "gVeTgmpTS9Z7cpje",
  database: process.env.MYSQL_DATABASE || "appdb",
  ssl: sslConfig
};

app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    const [rows] = await conn.query("SELECT 1 AS ok");
    await conn.end();
    res.json({ status: "ok", db: (rows as any)[0].ok === 1 });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err?.message || "unknown" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
