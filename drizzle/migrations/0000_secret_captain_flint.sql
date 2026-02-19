CREATE TABLE `dailyTaskCompletions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dailyTaskId` int NOT NULL,
	`completedDate` varchar(10) NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyTaskCompletions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`emoji` varchar(8) NOT NULL DEFAULT '✅',
	`xpReward` int NOT NULL DEFAULT 50,
	`goldReward` int NOT NULL DEFAULT 25,
	`category` varchar(64) NOT NULL DEFAULT 'health',
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `friendships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`friendId` int NOT NULL,
	`status` enum('pending','accepted') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `friendships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guildMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guildId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('leader','officer','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guildMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guildRaidParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`raidId` int NOT NULL,
	`userId` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guildRaidParticipants_id` PRIMARY KEY(`id`)
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
	`inviteCode` varchar(12),
	`leaderId` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`totalRaidsCompleted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guilds_id` PRIMARY KEY(`id`),
	CONSTRAINT `guilds_name_unique` UNIQUE(`name`),
	CONSTRAINT `guilds_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `taskCompletions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`userId` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`xpGained` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskCompletions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`epicName` text,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`xpReward` int NOT NULL,
	`xpPenalty` int NOT NULL,
	`repeatType` enum('daily','weekly','none') NOT NULL DEFAULT 'daily',
	`repeatDays` text,
	`repeatEndsAt` timestamp,
	`isOneTimeCompleted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
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
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`currentLevel` int NOT NULL DEFAULT 1,
	`xpInCurrentLevel` int NOT NULL DEFAULT 0,
	`xpNeededForNextLevel` int NOT NULL DEFAULT 100,
	`hp` int NOT NULL DEFAULT 100,
	`streak` int NOT NULL DEFAULT 0,
	`lastStreakUpdate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`equippedThemeId` varchar(64) NOT NULL DEFAULT 'default',
	`lastSeenVersion` varchar(32) NOT NULL DEFAULT '0.0.0',
	`gold` int NOT NULL DEFAULT 0,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `userThemes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`themeId` varchar(64) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userThemes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`avatarUrl` text,
	`name` text,
	`email` varchar(320),
	`passwordHash` varchar(256),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
