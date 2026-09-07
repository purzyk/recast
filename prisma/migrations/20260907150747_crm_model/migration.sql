/*
  Warnings:

  - You are about to drop the column `company` on the `Application` table. All the data in the column will be lost.
  - Added the required column `companyId` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExperienceKind" AS ENUM ('work', 'project', 'skill', 'achievement');

-- DropIndex
DROP INDEX "Application_status_idx";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "company",
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "companyId" INTEGER NOT NULL,
ADD COLUMN     "jobDescription" TEXT,
ADD COLUMN     "lastContactAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusEvent" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceEntry" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "ExperienceKind" NOT NULL,
    "period" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE INDEX "StatusEvent_applicationId_at_idx" ON "StatusEvent"("applicationId", "at");

-- CreateIndex
CREATE INDEX "Note_applicationId_createdAt_idx" ON "Note"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ExperienceEntry_kind_idx" ON "ExperienceEntry"("kind");

-- CreateIndex
CREATE INDEX "Application_companyId_role_idx" ON "Application"("companyId", "role");

-- CreateIndex
CREATE INDEX "Application_status_archived_idx" ON "Application"("status", "archived");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
