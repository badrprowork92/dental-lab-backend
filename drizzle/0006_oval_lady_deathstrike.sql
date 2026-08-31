CREATE TABLE `labCurrencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`currencyCode` varchar(3) NOT NULL,
	`displayName` varchar(40) NOT NULL,
	`symbol` varchar(12) NOT NULL,
	`exchangeRate` decimal(18,6) NOT NULL DEFAULT '1.000000',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labCurrencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `lab_currency_unique` UNIQUE(`labId`,`currencyCode`)
);
--> statement-breakpoint
ALTER TABLE `clients` ADD `defaultCurrencyCode` varchar(3) DEFAULT 'YER' NOT NULL;--> statement-breakpoint
ALTER TABLE `expenses` ADD `currencyCode` varchar(3) DEFAULT 'YER' NOT NULL;--> statement-breakpoint
ALTER TABLE `expenses` ADD `exchangeRate` decimal(18,6) DEFAULT '1.000000' NOT NULL;--> statement-breakpoint
ALTER TABLE `labSettings` ADD `baseCurrencyCode` varchar(3) DEFAULT 'YER' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `currencyCode` varchar(3) DEFAULT 'YER' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `exchangeRate` decimal(18,6) DEFAULT '1.000000' NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `currencyCode` varchar(3) DEFAULT 'YER' NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `exchangeRate` decimal(18,6) DEFAULT '1.000000' NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD `urgentPrice` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `supplierMaterials` ADD `currencyCode` varchar(3) DEFAULT 'YER' NOT NULL;--> statement-breakpoint
ALTER TABLE `supplierMaterials` ADD `exchangeRate` decimal(18,6) DEFAULT '1.000000' NOT NULL;--> statement-breakpoint
ALTER TABLE `supplierPayments` ADD `currencyCode` varchar(3) DEFAULT 'YER' NOT NULL;--> statement-breakpoint
ALTER TABLE `supplierPayments` ADD `exchangeRate` decimal(18,6) DEFAULT '1.000000' NOT NULL;--> statement-breakpoint
ALTER TABLE `technicianPayouts` ADD `payoutType` enum('payment','advance','bonus') DEFAULT 'payment' NOT NULL;--> statement-breakpoint
ALTER TABLE `technicianPayouts` ADD `paymentMethod` enum('cash','bank','pos') DEFAULT 'cash' NOT NULL;--> statement-breakpoint
ALTER TABLE `technicianPayouts` ADD `currencyCode` varchar(3) DEFAULT 'YER' NOT NULL;--> statement-breakpoint
ALTER TABLE `technicianPayouts` ADD `exchangeRate` decimal(18,6) DEFAULT '1.000000' NOT NULL;--> statement-breakpoint
ALTER TABLE `technicianWorkEntries` ADD `currencyCode` varchar(3) DEFAULT 'YER' NOT NULL;--> statement-breakpoint
ALTER TABLE `technicianWorkEntries` ADD `exchangeRate` decimal(18,6) DEFAULT '1.000000' NOT NULL;--> statement-breakpoint
ALTER TABLE `labCurrencies` ADD CONSTRAINT `labCurrencies_labId_labs_id_fk` FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `lab_currency_lab_idx` ON `labCurrencies` (`labId`);--> statement-breakpoint
UPDATE `services` SET `urgentPrice` = `basePrice` + 3000 WHERE `urgentPrice` = 0;--> statement-breakpoint
INSERT INTO `labCurrencies` (`labId`,`currencyCode`,`displayName`,`symbol`,`exchangeRate`,`isActive`) SELECT `id`,'YER','ريال يمني','ر.ي',1.000000,true FROM `labs`;--> statement-breakpoint
INSERT INTO `labCurrencies` (`labId`,`currencyCode`,`displayName`,`symbol`,`exchangeRate`,`isActive`) SELECT `id`,'SAR','ريال سعودي','ر.س',1.000000,true FROM `labs`;--> statement-breakpoint
INSERT INTO `labCurrencies` (`labId`,`currencyCode`,`displayName`,`symbol`,`exchangeRate`,`isActive`) SELECT `id`,'USD','دولار أمريكي','$',1.000000,true FROM `labs`;
