-- AlterTable
ALTER TABLE "ExperienceEntry" ADD COLUMN     "links" TEXT,
ADD COLUMN     "parentId" INTEGER;

-- CreateTable
CREATE TABLE "Profile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExperienceEntry" ADD CONSTRAINT "ExperienceEntry_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ExperienceEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

