CREATE TABLE `cashboxTransfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`fromCashboxId` int NOT NULL,
	`toCashboxId` int NOT NULL,
	`transferDate` varchar(10) NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`currencyCode` varchar(3) NOT NULL DEFAULT 'YER',
	`exchangeRate` decimal(18,6) NOT NULL DEFAULT '1.000000',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cashboxTransfers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cashboxes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`cashboxName` varchar(100) NOT NULL,
	`currencyCode` varchar(3) NOT NULL DEFAULT 'YER',
	`openingBalance` decimal(18,2) NOT NULL DEFAULT '0.00',
	`currentBalance` decimal(18,2) NOT NULL DEFAULT '0.00',
	`actualBalance` decimal(18,2) NOT NULL DEFAULT '0.00',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cashboxes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `expenses` ADD `cashboxId` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `cashboxId` int;--> statement-breakpoint
ALTER TABLE `supplierPayments` ADD `cashboxId` int;--> statement-breakpoint
ALTER TABLE `technicianPayouts` ADD `cashboxId` int;--> statement-breakpoint
ALTER TABLE `cashboxTransfers` ADD CONSTRAINT `cashboxTransfers_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cashboxTransfers` ADD CONSTRAINT `cashboxTransfers_fromCashboxId_cashboxes_id_fk` FOREIGN KEY (`fromCashboxId`) REFERENCES `cashboxes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cashboxTransfers` ADD CONSTRAINT `cashboxTransfers_toCashboxId_cashboxes_id_fk` FOREIGN KEY (`toCashboxId`) REFERENCES `cashboxes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cashboxes` ADD CONSTRAINT `cashboxes_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cashbox_transfers_lab_date_idx` ON `cashboxTransfers` (`labId`,`transferDate`);--> statement-breakpoint
CREATE INDEX `cashbox_transfers_from_idx` ON `cashboxTransfers` (`fromCashboxId`);--> statement-breakpoint
CREATE INDEX `cashbox_transfers_to_idx` ON `cashboxTransfers` (`toCashboxId`);--> statement-breakpoint
CREATE INDEX `cashboxes_lab_name_idx` ON `cashboxes` (`labId`,`cashboxName`);--> statement-breakpoint
CREATE INDEX `cashboxes_lab_idx` ON `cashboxes` (`labId`);--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_cashboxId_cashboxes_id_fk` FOREIGN KEY (`cashboxId`) REFERENCES `cashboxes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_cashboxId_cashboxes_id_fk` FOREIGN KEY (`cashboxId`) REFERENCES `cashboxes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierPayments` ADD CONSTRAINT `supplierPayments_cashboxId_cashboxes_id_fk` FOREIGN KEY (`cashboxId`) REFERENCES `cashboxes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `technicianPayouts` ADD CONSTRAINT `technicianPayouts_cashboxId_cashboxes_id_fk` FOREIGN KEY (`cashboxId`) REFERENCES `cashboxes`(`id`) ON DELETE restrict ON UPDATE no action;