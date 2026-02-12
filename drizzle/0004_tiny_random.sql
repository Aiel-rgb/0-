CREATE TABLE `guildMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guildId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('leader','officer','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guildMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guildRaids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guildId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`xpReward` int NOT NULL DEFAULT 500,
	`assignedByUserId` int NOT NULL,
	`status` enum('active','completed','failed') NOT NULL DEFAULT 'active',
	`month` int NOT NULL,
	`year` int NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guildRaids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guilds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`bannerUrl` text,
	`leaderId` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`totalRaidsCompleted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guilds_id` PRIMARY KEY(`id`),
	CONSTRAINT `guilds_name_unique` UNIQUE(`name`)
);
