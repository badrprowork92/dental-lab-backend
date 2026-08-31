CREATE TABLE `clients` (
  `id` int AUTO_INCREMENT NOT NULL,
  `doctorName` varchar(100) NOT NULL,
  `clinicName` varchar(100) NOT NULL,
  `phoneNumber` varchar(20),
  `creditLimit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currentBalance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `category` varchar(50) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `expenseDate` varchar(10) NOT NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
  `id` int AUTO_INCREMENT NOT NULL,
  `category` varchar(100) NOT NULL,
  `serviceName` varchar(100) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technicians` (
  `id` int AUTO_INCREMENT NOT NULL,
  `techName` varchar(100) NOT NULL,
  `specialty` varchar(50) NOT NULL,
  `commissionType` enum('fixed_per_tooth','percentage') NOT NULL,
  `commissionRate` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currentBalance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `technicians_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
  `id` int AUTO_INCREMENT NOT NULL,
  `invoiceNumber` varchar(50) NOT NULL,
  `clientId` int NOT NULL,
  `patientName` varchar(100),
  `orderDate` varchar(10) NOT NULL,
  `orderType` enum('normal','urgent','adjustment') NOT NULL DEFAULT 'normal',
  `serviceId` int NOT NULL,
  `upperRight` varchar(50) NOT NULL DEFAULT '',
  `upperLeft` varchar(50) NOT NULL DEFAULT '',
  `lowerRight` varchar(50) NOT NULL DEFAULT '',
  `lowerLeft` varchar(50) NOT NULL DEFAULT '',
  `teethCount` int NOT NULL DEFAULT 0,
  `unitPrice` decimal(12,2) NOT NULL,
  `totalAmount` decimal(12,2) GENERATED ALWAYS AS (teethCount * unitPrice) STORED,
  `orderStatus` enum('new','in_progress','completed','delivered') NOT NULL DEFAULT 'new',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `orders_id` PRIMARY KEY(`id`),
  CONSTRAINT `orders_invoiceNumber_unique` UNIQUE(`invoiceNumber`),
  CONSTRAINT `orders_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `orders_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `orderTechnicians` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderId` int NOT NULL,
  `technicianId` int NOT NULL,
  `stageName` enum('wax','ceramic','finishing','fitting','other') NOT NULL,
  `assignedTeeth` int NOT NULL,
  `commissionEarned` decimal(10,2) NOT NULL DEFAULT '0.00',
  `isCompleted` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `orderTechnicians_id` PRIMARY KEY(`id`),
  CONSTRAINT `orderTechnicians_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  CONSTRAINT `orderTechnicians_technicianId_technicians_id_fk` FOREIGN KEY (`technicianId`) REFERENCES `technicians`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `payments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `receiptNumber` int NOT NULL,
  `clientId` int NOT NULL,
  `paymentDate` varchar(10) NOT NULL,
  `amountPaid` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `paymentMethod` enum('cash','bank','pos') NOT NULL DEFAULT 'cash',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `payments_id` PRIMARY KEY(`id`),
  CONSTRAINT `payments_receiptNumber_unique` UNIQUE(`receiptNumber`),
  CONSTRAINT `payments_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `technicianPayouts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `technicianId` int NOT NULL,
  `payoutDate` varchar(10) NOT NULL,
  `amountPaid` decimal(12,2) NOT NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `technicianPayouts_id` PRIMARY KEY(`id`),
  CONSTRAINT `technicianPayouts_technicianId_technicians_id_fk` FOREIGN KEY (`technicianId`) REFERENCES `technicians`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `technicianRates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `technicianId` int NOT NULL,
  `serviceId` int NOT NULL,
  `ratePerTooth` decimal(10,2) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `technicianRates_id` PRIMARY KEY(`id`),
  CONSTRAINT `technician_service_unique` UNIQUE(`technicianId`,`serviceId`),
  CONSTRAINT `technicianRates_technicianId_technicians_id_fk` FOREIGN KEY (`technicianId`) REFERENCES `technicians`(`id`) ON DELETE CASCADE,
  CONSTRAINT `technicianRates_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `clients_clinic_idx` ON `clients` (`clinicName`);
--> statement-breakpoint
CREATE INDEX `expenses_date_idx` ON `expenses` (`expenseDate`);
--> statement-breakpoint
CREATE INDEX `assignments_order_idx` ON `orderTechnicians` (`orderId`);
--> statement-breakpoint
CREATE INDEX `assignments_tech_idx` ON `orderTechnicians` (`technicianId`);
--> statement-breakpoint
CREATE INDEX `orders_client_idx` ON `orders` (`clientId`);
--> statement-breakpoint
CREATE INDEX `orders_date_idx` ON `orders` (`orderDate`);
--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`orderStatus`);
--> statement-breakpoint
CREATE INDEX `payments_client_idx` ON `payments` (`clientId`);
--> statement-breakpoint
CREATE INDEX `services_category_idx` ON `services` (`category`);
--> statement-breakpoint
CREATE INDEX `payouts_tech_idx` ON `technicianPayouts` (`technicianId`);
--> statement-breakpoint
CREATE INDEX `technicians_name_idx` ON `technicians` (`techName`);
