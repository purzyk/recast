-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('cv', 'coverLetter');

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSource" (
    "documentId" INTEGER NOT NULL,
    "entryId" INTEGER NOT NULL,

    CONSTRAINT "DocumentSource_pkey" PRIMARY KEY ("documentId","entryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_applicationId_kind_version_key" ON "Document"("applicationId", "kind", "version");

-- CreateIndex
CREATE INDEX "DocumentSource_entryId_idx" ON "DocumentSource"("entryId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSource" ADD CONSTRAINT "DocumentSource_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSource" ADD CONSTRAINT "DocumentSource_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "ExperienceEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

