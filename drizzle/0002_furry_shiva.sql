CREATE TABLE `labSettings` (
	`id` int NOT NULL,
	`labName` varchar(150) NOT NULL DEFAULT '',
	`phoneNumber` varchar(30) NOT NULL DEFAULT '',
	`location` varchar(255) NOT NULL DEFAULT '',
	`logoUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technicianWorkEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`technicianId` int NOT NULL,
	`workDate` varchar(10) NOT NULL,
	`piecesCount` int NOT NULL,
	`unitRate` decimal(12,2) NOT NULL,
	`totalAmount` decimal(12,2) GENERATED ALWAYS AS (piecesCount * unitRate) STORED,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `technicianWorkEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` DROP INDEX `orders_invoiceNumber_unique`;--> statement-breakpoint
ALTER TABLE `orders` ADD `caseMonth` varchar(7) NOT NULL DEFAULT '0000-00';--> statement-breakpoint
UPDATE `orders` SET `caseMonth` = LEFT(`orderDate`, 7) WHERE `caseMonth` = '0000-00';--> statement-breakpoint
ALTER TABLE `services` ADD `basePrice` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_case_month_number_unique` UNIQUE(`caseMonth`,`invoiceNumber`);--> statement-breakpoint
ALTER TABLE `technicianWorkEntries` ADD CONSTRAINT `technicianWorkEntries_technicianId_technicians_id_fk` FOREIGN KEY (`technicianId`) REFERENCES `technicians`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `technician_work_technician_idx` ON `technicianWorkEntries` (`technicianId`);--> statement-breakpoint
CREATE INDEX `technician_work_date_idx` ON `technicianWorkEntries` (`workDate`);
