CREATE TABLE `tables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableNumber` varchar(50) NOT NULL,
	`capacity` int NOT NULL,
	`area` varchar(100),
	`type` varchar(50),
	`isActive` int NOT NULL DEFAULT 1,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tables_id` PRIMARY KEY(`id`),
	CONSTRAINT `tables_tableNumber_unique` UNIQUE(`tableNumber`)
);
