-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'AUCTIONEER', 'CAPTAIN', 'SPECTATOR') NOT NULL DEFAULT 'SPECTATOR',
    `teamId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_teamId_key`(`teamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Team` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `abbreviation` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#f59e0b',
    `logoUrl` VARCHAR(191) NULL,
    `captainName` VARCHAR(191) NULL,
    `captainEmail` VARCHAR(191) NULL,
    `isDummy` BOOLEAN NOT NULL DEFAULT false,
    `startingPurse` INTEGER NOT NULL DEFAULT 100000,
    `purse` INTEGER NOT NULL DEFAULT 100000,
    `spent` INTEGER NOT NULL DEFAULT 0,
    `squadCount` INTEGER NOT NULL DEFAULT 0,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Team_name_key`(`name`),
    UNIQUE INDEX `Team_abbreviation_key`(`abbreviation`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Player` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `photoUrl` VARCHAR(191) NULL,
    `age` INTEGER NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `hostelBlock` VARCHAR(191) NULL,
    `roomNumber` VARCHAR(191) NULL,
    `role` ENUM('BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKETKEEPER') NOT NULL DEFAULT 'BATSMAN',
    `battingStyle` VARCHAR(191) NULL,
    `bowlingStyle` VARCHAR(191) NULL,
    `experience` VARCHAR(191) NULL,
    `previousExp` VARCHAR(191) NULL,
    `matches` INTEGER NOT NULL DEFAULT 0,
    `runs` INTEGER NOT NULL DEFAULT 0,
    `wickets` INTEGER NOT NULL DEFAULT 0,
    `strikeRate` DOUBLE NULL,
    `economy` DOUBLE NULL,
    `achievements` TEXT NULL,
    `bio` TEXT NULL,
    `basePrice` INTEGER NOT NULL DEFAULT 2000,
    `status` ENUM('REGISTERED', 'REJECTED', 'APPROVED', 'WAITING', 'LIVE', 'SOLD', 'UNSOLD', 'SKIPPED') NOT NULL DEFAULT 'REGISTERED',
    `queueOrder` INTEGER NULL,
    `soldPrice` INTEGER NULL,
    `soldToId` VARCHAR(191) NULL,
    `soldAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Player_status_idx`(`status`),
    INDEX `Player_queueOrder_idx`(`queueOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlayerRegistration` (
    `id` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PlayerRegistration_playerId_key`(`playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuctionSettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `auctionName` VARCHAR(191) NOT NULL DEFAULT 'HPL Auction 2026',
    `auctionDate` DATETIME(3) NULL,
    `startingPurse` INTEGER NOT NULL DEFAULT 100000,
    `maxSquadSize` INTEGER NOT NULL DEFAULT 11,
    `maxPlayers` INTEGER NOT NULL DEFAULT 100,
    `bidIncrement` INTEGER NOT NULL DEFAULT 1000,
    `timerSeconds` INTEGER NOT NULL DEFAULT 15,
    `registrationDeadline` DATETIME(3) NULL,
    `registrationOpen` BOOLEAN NOT NULL DEFAULT true,
    `spectatorAccess` BOOLEAN NOT NULL DEFAULT true,
    `unsoldReentry` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Auction` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `state` ENUM('WAITING', 'LIVE', 'PAUSED', 'PLAYER_LIVE', 'SOLD', 'UNSOLD', 'COMPLETED') NOT NULL DEFAULT 'WAITING',
    `currentPlayerId` VARCHAR(191) NULL,
    `currentBid` INTEGER NOT NULL DEFAULT 0,
    `highestTeamId` VARCHAR(191) NULL,
    `highestBidId` VARCHAR(191) NULL,
    `timerEndsAt` DATETIME(3) NULL,
    `timerRemainingMs` INTEGER NULL,
    `timerRunning` BOOLEAN NOT NULL DEFAULT false,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuctionSession` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bid` (
    `id` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Bid_playerId_createdAt_idx`(`playerId`, `createdAt`),
    INDEX `Bid_teamId_idx`(`teamId`),
    UNIQUE INDEX `Bid_playerId_amount_key`(`playerId`, `amount`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuctionEvent` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NULL,
    `teamId` VARCHAR(191) NULL,
    `amount` INTEGER NULL,
    `payload` JSON NULL,
    `undone` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuctionEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SquadPlayer` (
    `id` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SquadPlayer_playerId_key`(`playerId`),
    INDEX `SquadPlayer_teamId_idx`(`teamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_read_idx`(`userId`, `read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `details` JSON NULL,
    `ip` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Player` ADD CONSTRAINT `Player_soldToId_fkey` FOREIGN KEY (`soldToId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlayerRegistration` ADD CONSTRAINT `PlayerRegistration_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bid` ADD CONSTRAINT `Bid_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bid` ADD CONSTRAINT `Bid_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bid` ADD CONSTRAINT `Bid_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuctionEvent` ADD CONSTRAINT `AuctionEvent_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuctionEvent` ADD CONSTRAINT `AuctionEvent_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SquadPlayer` ADD CONSTRAINT `SquadPlayer_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SquadPlayer` ADD CONSTRAINT `SquadPlayer_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
