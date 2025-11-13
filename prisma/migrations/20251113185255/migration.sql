/*
  Warnings:

  - You are about to drop the column `endDate` on the `Holiday` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Holiday` table. All the data in the column will be lost.
  - Added the required column `date` to the `Holiday` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Holiday_startDate_endDate_idx";

-- AlterTable
ALTER TABLE "Holiday" DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");
