CREATE TABLE `Vote` (
	`id` text PRIMARY KEY NOT NULL,
	`gameId` text NOT NULL,
	`voterId` text NOT NULL,
	`playerId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`voterId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`playerId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Vote_gameId_voterId_key` ON `Vote` (`gameId`,`voterId`);