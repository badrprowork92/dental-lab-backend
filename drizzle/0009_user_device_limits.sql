ALTER TABLE `labUsers`
  ADD COLUMN IF NOT EXISTS `maxDevices` INT NOT NULL DEFAULT 1;

UPDATE `labUsers` AS u
INNER JOIN `labs` AS l ON l.`id` = u.`labId`
SET u.`maxDevices` = l.`maxDevices`
WHERE u.`role` = 'lab_user'
  AND (u.`maxDevices` IS NULL OR u.`maxDevices` = 1);

CREATE INDEX IF NOT EXISTS `lab_users_max_devices_idx` ON `labUsers` (`labId`, `maxDevices`);
