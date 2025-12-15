/*
  Warnings:

  - You are about to drop the `AcademicPeriod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Holiday` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Semester" ADD COLUMN "academicCalendarUrl" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AcademicPeriod";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Holiday";
PRAGMA foreign_keys=on;
