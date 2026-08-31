import mysql from "mysql2/promise";
import fs from "node:fs";

const cfg = JSON.parse(fs.readFileSync(new URL("../.project-config.json", import.meta.url), "utf8"));
const url = cfg.secrets?.DATABASE_URL || cfg.env_vars?.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not configured");
const db = await mysql.createConnection(url);
const [cols] = await db.query("SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'labUsers' AND COLUMN_NAME = 'maxDevices'");
if (!Number(cols[0].n)) await db.query("ALTER TABLE `labUsers` ADD COLUMN `maxDevices` INT NOT NULL DEFAULT 1");
await db.query("UPDATE `labUsers` u INNER JOIN `labs` l ON l.`id` = u.`labId` SET u.`maxDevices` = l.`maxDevices` WHERE u.`role` = 'lab_user' AND u.`maxDevices` = 1");
const [result] = await db.query("SELECT COUNT(*) AS users, MIN(maxDevices) AS minLimit, MAX(maxDevices) AS maxLimit FROM labUsers WHERE role = 'lab_user'");
console.log(JSON.stringify({ migrated: true, ...result[0] }));
await db.end();
