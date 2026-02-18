CREATE TABLE `guildRaidParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`raidId` int NOT NULL,
	`userId` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guildRaidParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `hp` int DEFAULT 100 NOT NULL;