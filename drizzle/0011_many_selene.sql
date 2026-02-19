ALTER TABLE `tasks` ADD `repeatType` enum('daily','weekly','none') DEFAULT 'daily' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `repeatDays` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `repeatEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `tasks` ADD `isOneTimeCompleted` int DEFAULT 0 NOT NULL;