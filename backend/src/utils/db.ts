import mysql from "mysql2/promise";
import dotenv from "dotenv";
// import fs from "fs";

dotenv.config();

let sslConfig: any = { rejectUnauthorized: false };
/*
const caPath = process.env.TIDB_CA_PATH;
if (caPath) {
  sslConfig = { ca: fs.readFileSync(caPath) };
}
*/

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});
