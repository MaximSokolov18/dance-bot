/*
  Warnings:

  - You are about to drop the column `classDays` on the `Group` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Group" DROP COLUMN "classDays";

-- CreateTable
CREATE TABLE "ClassDay" (
    "id" SERIAL NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "time" TEXT NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "ClassDay_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClassDay" ADD CONSTRAINT "ClassDay_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
