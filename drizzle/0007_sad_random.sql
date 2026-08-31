ALTER TABLE `labUsers` ADD `sessionVersion` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `labUsers` ADD `mustChangePassword` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `labUsers` ADD `sessionVersion` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `labs` ADD `subscriptionStartDate` varchar(10);--> statement-breakpoint
ALTER TABLE `labs` ADD `subscriptionEndDate` varchar(10);
