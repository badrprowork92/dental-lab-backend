import mysql from "mysql2/promise";
import fs from "node:fs";
const cfg = JSON.parse(fs.readFileSync(new URL("../.project-config.json", import.meta.url), "utf8"));
const url = cfg.secrets?.DATABASE_URL || cfg.env_vars?.DATABASE_URL;
const db = await mysql.createConnection(url);
try {
  const [tables] = await db.query("SHOW TABLES LIKE 'labUsers'");
  const [columns] = await db.query("SHOW COLUMNS FROM labUsers");
  const names = columns.map((c) => c.Field);
  const [rows] = await db.query("SELECT u.id, u.labId, u.username, u.passwordHash, u.role, u.isActive AS userActive, u.sessionVersion, u.mustChangePassword, u.maxDevices, l.isActive AS labActive, l.maxDevices AS labMaxDevices, l.subscriptionEndDate FROM labUsers u LEFT JOIN labs l ON u.labId = l.id WHERE u.username = ? LIMIT 1", ["invalid-test-user"]);
  console.log(JSON.stringify({ tableExists: tables.length > 0, columns: names, loginQuery: "ok", rows: rows.length }));
} catch (error) {
  console.error(JSON.stringify({ name: error?.name, code: error?.code, errno: error?.errno, sqlState: error?.sqlState, message: error?.message }));
  process.exitCode = 1;
} finally { await db.end(); }
