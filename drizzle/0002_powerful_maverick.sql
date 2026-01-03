CREATE TABLE `reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableId` int NOT NULL,
	`customerName` varchar(100) NOT NULL,
	`customerPhone` varchar(50) NOT NULL,
	`customerEmail` varchar(100),
	`partySize` int NOT NULL,
	`reservationTime` timestamp NOT NULL,
	`duration` int NOT NULL DEFAULT 120,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`)
);
