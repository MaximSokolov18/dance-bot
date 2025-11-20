/*
  Warnings:

  - You are about to alter the column `time` on the `ClassDay` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(5)`.
  - You are about to alter the column `amountOfPayment` on the `Subscription` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `illnessCount` on the `Subscription` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - A unique constraint covering the columns `[userId,isActive]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ClassDay" ALTER COLUMN "time" SET DATA TYPE VARCHAR(5);

-- AlterTable
ALTER TABLE "Feedback" ALTER COLUMN "telegramId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "amountOfPayment" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "illnessCount" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "telegramId" SET DATA TYPE BIGINT;

-- CreateTable
CREATE TABLE "NotificationSchedule" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSent" TIMESTAMP(3),
    "nextDue" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSchedule_userId_key" ON "NotificationSchedule"("userId");

-- CreateIndex
CREATE INDEX "NotificationSchedule_isEnabled_nextDue_idx" ON "NotificationSchedule"("isEnabled", "nextDue");

-- CreateIndex
CREATE INDEX "ClassDay_groupId_idx" ON "ClassDay"("groupId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_groupId_idx" ON "Subscription"("groupId");

-- CreateIndex
CREATE INDEX "Subscription_startDate_idx" ON "Subscription"("startDate");

-- CreateIndex
CREATE INDEX "Subscription_userId_startDate_idx" ON "Subscription"("userId", "startDate" DESC);

-- CreateIndex
CREATE INDEX "Subscription_userId_isActive_idx" ON "Subscription"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_subscription" ON "Subscription"("userId", "isActive");

-- CreateIndex
CREATE INDEX "User_allowNotifications_idx" ON "User"("allowNotifications");

-- AddForeignKey
ALTER TABLE "NotificationSchedule" ADD CONSTRAINT "NotificationSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
