CREATE TABLE `allocation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`line` text NOT NULL,
	`loss_category` text NOT NULL,
	`loss_detail` text NOT NULL,
	`detail_text` text NOT NULL,
	`allocation_ratio` real NOT NULL,
	`minutes_allocated` real NOT NULL,
	`is_manual_excluded` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `allocation_date_line_idx` ON `allocation` (`date`,`line`);--> statement-breakpoint
CREATE INDEX `allocation_loss_detail_idx` ON `allocation` (`loss_detail`);--> statement-breakpoint
CREATE TABLE `line_day` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`line` text NOT NULL,
	`date` text NOT NULL,
	`production_loss` real NOT NULL,
	`equipment_loss` real NOT NULL,
	`material_loss` real NOT NULL,
	`management_loss` real NOT NULL,
	`line_imbalance_loss` real NOT NULL,
	`material_change_loss` real NOT NULL,
	`six_loss_total` real NOT NULL,
	`plan_minutes` real NOT NULL,
	`operating_minutes` real NOT NULL,
	`operating_rate` real NOT NULL
);
--> statement-breakpoint
CREATE INDEX `line_day_line_date_idx` ON `line_day` (`line`,`date`);--> statement-breakpoint
CREATE INDEX `line_day_date_idx` ON `line_day` (`date`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`summary_file` text NOT NULL,
	`detail_file` text NOT NULL,
	`uploaded_at` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text
);
