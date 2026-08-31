CREATE TABLE `supplierMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`materialDate` varchar(10) NOT NULL,
	`materialDescription` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplierMaterials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplierPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`paymentDate` varchar(10) NOT NULL,
	`amountPaid` decimal(12,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplierPayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierName` varchar(150) NOT NULL,
	`phoneNumber` varchar(30),
	`address` varchar(255),
	`currentBalance` decimal(12,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `expenses` ADD `costType` enum('materials','wages','rent','installments','utilities','other') DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE `labSettings` ADD `headerNote1` varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `labSettings` ADD `headerNote2` varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `labSettings` ADD `headerNote3` varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `supplierMaterials` ADD CONSTRAINT `supplierMaterials_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierPayments` ADD CONSTRAINT `supplierPayments_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `supplier_material_supplier_idx` ON `supplierMaterials` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplier_material_date_idx` ON `supplierMaterials` (`materialDate`);--> statement-breakpoint
CREATE INDEX `supplier_payment_supplier_idx` ON `supplierPayments` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplier_payment_date_idx` ON `supplierPayments` (`paymentDate`);--> statement-breakpoint
CREATE INDEX `suppliers_name_idx` ON `suppliers` (`supplierName`);