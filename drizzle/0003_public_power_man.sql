ALTER TABLE `userProfiles` ADD `streak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD `lastStreakUpdate` timestamp;