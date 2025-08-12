CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
);

CREATE TABLE `users` (
  `id` integer UNIQUE PRIMARY KEY AUTO_INCREMENT,
  `username` varchar(255),
  `email` varchar(255),
  `password` varchar(255),
  `creation_data` date,
  `last_login_date` date,
  `status` varchar(255),
  `googleId` varchar(255),
  `token` varchar(255),
  `avatar` longtext,
  `isPublic` bool
);

CREATE TABLE `band` (
  `id` integer UNIQUE PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `description` varchar(255),
  `biography` longtext,
  `logo` longtext,
  `isPublic` bool
);

CREATE TABLE `band_member` (
  `id` integer UNIQUE PRIMARY KEY AUTO_INCREMENT,
  `user_id` integer,
  `band_id` integer,
  `role` varchar(255)
);

CREATE TABLE `song` (
  `id` integer UNIQUE PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `band_id` integer,
  `artist` varchar(255),
  `duration` integer,
  `link` varchar(255),
  `removed` bool
);

CREATE TABLE `setlist` (
  `id` integer UNIQUE PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `band_id` integer,
  `template` bool,
  `duration` integer,
  `isPublic` bool
);

CREATE TABLE `setlist_song` (
  `id` integer UNIQUE PRIMARY KEY AUTO_INCREMENT,
  `setlist_id` integer,
  `song_id` integer,
  `position` integer
);

CREATE TABLE `event` (
  `id` integer UNIQUE PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `band_id` integer,
  `setlist_id` integer,
  `venue_id` integer,
  `vanue_name` varchar(255),
  `address` varchar(255),
  `datetime` datetime,
  `poster` longtext,
  `isPublic` bool
);

CREATE TABLE `venue` (
  `id` integer UNIQUE PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `address` varchar(255),
  `website` varchar(255)
);

CREATE TABLE `member_event` (
  `id` integer UNIQUE PRIMARY KEY AUTO_INCREMENT,
  `member_id` integer,
  `event_id` integer
);

ALTER TABLE `band_member` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `band_member` ADD FOREIGN KEY (`band_id`) REFERENCES `band` (`id`);

ALTER TABLE `song` ADD FOREIGN KEY (`band_id`) REFERENCES `band` (`id`);

ALTER TABLE `setlist` ADD FOREIGN KEY (`band_id`) REFERENCES `band` (`id`);

ALTER TABLE `setlist_song` ADD FOREIGN KEY (`song_id`) REFERENCES `song` (`id`);

ALTER TABLE `setlist_song` ADD FOREIGN KEY (`setlist_id`) REFERENCES `setlist` (`id`);

ALTER TABLE `event` ADD FOREIGN KEY (`venue_id`) REFERENCES `venue` (`id`);

ALTER TABLE `event` ADD FOREIGN KEY (`setlist_id`) REFERENCES `setlist` (`id`);

ALTER TABLE `event` ADD FOREIGN KEY (`band_id`) REFERENCES `band` (`id`);

ALTER TABLE `member_event` ADD FOREIGN KEY (`member_id`) REFERENCES `users` (`id`);

ALTER TABLE `member_event` ADD FOREIGN KEY (`event_id`) REFERENCES `event` (`id`);
