CREATE TABLE `shopItems` (
	`id` varchar(64) NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`category` enum('consumable','cosmetic') NOT NULL,
	`iconName` varchar(64) NOT NULL,
	`status` enum('draft','active','deleted') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dailyTasks` ADD `status` enum('draft','active','deleted') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `dailyTasks` ADD `isPool` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `dungeonMissions` ADD `status` enum('draft','active','deleted') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `dungeons` ADD `status` enum('draft','active','deleted') DEFAULT 'active' NOT NULL;