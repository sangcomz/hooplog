CREATE TABLE `Guest` (
	`id` text PRIMARY KEY NOT NULL,
	`gameId` text NOT NULL,
	`name` text NOT NULL,
	`tier` text DEFAULT 'C' NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `Game` ADD `teamCount` integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `Game` ADD `teams` text;