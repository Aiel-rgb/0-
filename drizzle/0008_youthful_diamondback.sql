CREATE TABLE `dungeonMissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dungeonId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`xpReward` int NOT NULL DEFAULT 100,
	`goldReward` int NOT NULL DEFAULT 50,
	`orderIndex` int NOT NULL DEFAULT 0,
	CONSTRAINT `dungeonMissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dungeonProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dungeonId` int NOT NULL,
	`missionId` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dungeonProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dungeons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`theme` varchar(64) NOT NULL,
	`description` text,
	`bannerEmoji` varchar(8) NOT NULL DEFAULT '🏰',
	`themeRewardId` varchar(64),
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dungeons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userThemes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`themeId` varchar(64) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userThemes_id` PRIMARY KEY(`id`)
);
