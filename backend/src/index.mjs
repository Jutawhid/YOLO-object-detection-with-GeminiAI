import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.BACKEND_LOG_LEVEL || 'dev'));

const PORT = Number(process.env.BACKEND_PORT || 4000);
const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'mysql',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'appuser',
  password: process.env.MYSQL_PASSWORD || 'app_password',
  database: process.env.MYSQL_DATABASE || 'appdb'
};

app.get('/api/health', async (_req, res) => {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    const [rows] = await conn.query('SELECT 1 AS ok');
    await conn.end();
    res.json({ status: 'ok', db: rows[0].ok === 1 });
  } catch (err) {
    res.status(500).json({ status: 'error', error: (err && err.message) || 'unknown' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
