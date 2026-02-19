CREATE TABLE `guildUpgrades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guildId` int NOT NULL,
	`upgradeId` varchar(64) NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`expiresAt` timestamp,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guildUpgrades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userCosmetics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cosmeticId` varchar(64) NOT NULL,
	`equipped` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userCosmetics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userInventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemId` varchar(64) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userInventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`petId` varchar(64) NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`experience` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 0,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `guilds` DROP INDEX `guilds_name_unique`;--> statement-breakpoint
ALTER TABLE `guilds` MODIFY COLUMN `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `guilds` MODIFY COLUMN `inviteCode` varchar(16);--> statement-breakpoint
ALTER TABLE `guilds` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `guilds` ADD `vaultGold` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `gold` int DEFAULT 0 NOT NULL;