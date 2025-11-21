import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// @ts-ignore: missing type declarations for ../utils/db
import { pool } from "../utils/db.js";

const router = Router();
const SALT_ROUNDS = 10;

router.post("/signup", async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, NOW())",
      [name, email, hashed]
    );
    const insertId = (result as any).insertId;
    return res.status(201).json({ message: "User created", userId: insertId });
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Email already exists" });
    return res.status(500).json({ error: "Signup failed", details: err.message });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const [rows] = await pool.query("SELECT name, id, password_hash FROM users WHERE email = ?", [email]);
    const user = (rows as any)[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const secret = process.env.JWT_SECRET || "changeme";
    const token = jwt.sign(
      { userId: user.id, name: user.name },
      secret,
      { expiresIn: "30d" }
    );
    return res.json({
      token,
      id: user.id,
      name: user.name,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Login failed", details: err.message });
  }
});

export default router;
