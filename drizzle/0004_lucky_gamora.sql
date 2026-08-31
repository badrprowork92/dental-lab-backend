CREATE TABLE `labs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `labCode` varchar(40) NOT NULL,
  `displayName` varchar(150) NOT NULL,
  `isActive` boolean NOT NULL DEFAULT true,
  `maxDevices` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `labs_id` PRIMARY KEY(`id`),
  CONSTRAINT `labs_code_unique` UNIQUE(`labCode`)
);
--> statement-breakpoint
CREATE TABLE `labUsers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `labId` int,
  `username` varchar(80) NOT NULL,
  `email` varchar(320),
  `passwordHash` varchar(255) NOT NULL,
  `role` enum('admin','lab_user') NOT NULL DEFAULT 'lab_user',
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp,
  CONSTRAINT `labUsers_id` PRIMARY KEY(`id`),
  CONSTRAINT `lab_users_username_unique` UNIQUE(`username`),
  CONSTRAINT `lab_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `labDevices` (
  `id` int AUTO_INCREMENT NOT NULL,
  `labId` int NOT NULL,
  `deviceFingerprint` varchar(128) NOT NULL,
  `deviceLabel` varchar(120),
  `registeredAt` timestamp NOT NULL DEFAULT (now()),
  `lastSeenAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `labDevices_id` PRIMARY KEY(`id`),
  CONSTRAINT `lab_devices_lab_fingerprint_unique` UNIQUE(`labId`,`deviceFingerprint`)
);
--> statement-breakpoint
INSERT INTO `labs` (`id`, `labCode`, `displayName`, `isActive`, `maxDevices`) VALUES (1, 'legacy-001', 'المختبر الحالي', true, 1);
--> statement-breakpoint
ALTER TABLE `orders` DROP INDEX `orders_case_month_number_unique`;
--> statement-breakpoint
ALTER TABLE `payments` DROP INDEX `payments_receiptNumber_unique`;
--> statement-breakpoint
DROP INDEX `expenses_date_idx` ON `expenses`;
--> statement-breakpoint
DROP INDEX `orders_date_idx` ON `orders`;
--> statement-breakpoint
DROP INDEX `services_category_idx` ON `services`;
--> statement-breakpoint
DROP INDEX `supplier_material_date_idx` ON `supplierMaterials`;
--> statement-breakpoint
DROP INDEX `supplier_payment_date_idx` ON `supplierPayments`;
--> statement-breakpoint
DROP INDEX `suppliers_name_idx` ON `suppliers`;
--> statement-breakpoint
DROP INDEX `technician_work_date_idx` ON `technicianWorkEntries`;
--> statement-breakpoint
DROP INDEX `technicians_name_idx` ON `technicians`;
--> statement-breakpoint
DROP INDEX `clients_clinic_idx` ON `clients`;
--> statement-breakpoint
ALTER TABLE `clients` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `expenses` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `labSettings` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `orderTechnicians` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `orders` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `payments` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `services` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `supplierMaterials` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `supplierPayments` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `suppliers` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `technicianPayouts` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `technicianRates` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `technicianWorkEntries` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `technicians` ADD `labId` int NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `clients` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `expenses` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `labSettings` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `orderTechnicians` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `orders` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `payments` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `services` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `supplierMaterials` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `supplierPayments` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `suppliers` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `technicianPayouts` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `technicianRates` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `technicianWorkEntries` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `technicians` MODIFY `labId` int NOT NULL;
--> statement-breakpoint
UPDATE `labs` SET `displayName` = COALESCE(NULLIF((SELECT `labName` FROM `labSettings` WHERE `id` = 1 LIMIT 1), ''), `displayName`) WHERE `id` = 1;
--> statement-breakpoint
ALTER TABLE `labSettings` ADD CONSTRAINT `lab_settings_lab_unique` UNIQUE(`labId`);
--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_lab_case_month_number_unique` UNIQUE(`labId`,`caseMonth`,`invoiceNumber`);
--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_lab_receipt_unique` UNIQUE(`labId`,`receiptNumber`);
--> statement-breakpoint
ALTER TABLE `labDevices` ADD CONSTRAINT `labDevices_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `labUsers` ADD CONSTRAINT `labUsers_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `labSettings` ADD CONSTRAINT `labSettings_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `orderTechnicians` ADD CONSTRAINT `orderTechnicians_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `services` ADD CONSTRAINT `services_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `supplierMaterials` ADD CONSTRAINT `supplierMaterials_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `supplierPayments` ADD CONSTRAINT `supplierPayments_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `technicianPayouts` ADD CONSTRAINT `technicianPayouts_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `technicianRates` ADD CONSTRAINT `technicianRates_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `technicianWorkEntries` ADD CONSTRAINT `technicianWorkEntries_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `technicians` ADD CONSTRAINT `technicians_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `lab_devices_lab_idx` ON `labDevices` (`labId`);
--> statement-breakpoint
CREATE INDEX `lab_users_lab_idx` ON `labUsers` (`labId`);
--> statement-breakpoint
CREATE INDEX `clients_lab_idx` ON `clients` (`labId`);
--> statement-breakpoint
CREATE INDEX `expenses_lab_date_idx` ON `expenses` (`labId`,`expenseDate`);
--> statement-breakpoint
CREATE INDEX `assignments_lab_idx` ON `orderTechnicians` (`labId`);
--> statement-breakpoint
CREATE INDEX `orders_lab_date_idx` ON `orders` (`labId`,`orderDate`);
--> statement-breakpoint
CREATE INDEX `services_lab_category_idx` ON `services` (`labId`,`category`);
--> statement-breakpoint
CREATE INDEX `supplier_material_lab_date_idx` ON `supplierMaterials` (`labId`,`materialDate`);
--> statement-breakpoint
CREATE INDEX `supplier_payment_lab_date_idx` ON `supplierPayments` (`labId`,`paymentDate`);
--> statement-breakpoint
CREATE INDEX `suppliers_lab_name_idx` ON `suppliers` (`labId`,`supplierName`);
--> statement-breakpoint
CREATE INDEX `payouts_lab_idx` ON `technicianPayouts` (`labId`);
--> statement-breakpoint
CREATE INDEX `technician_work_lab_date_idx` ON `technicianWorkEntries` (`labId`,`workDate`);
--> statement-breakpoint
CREATE INDEX `technicians_lab_name_idx` ON `technicians` (`labId`,`techName`);
--> statement-breakpoint
CREATE INDEX `clients_clinic_idx` ON `clients` (`labId`,`clinicName`);
