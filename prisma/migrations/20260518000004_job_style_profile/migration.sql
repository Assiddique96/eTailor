-- Create table for per-job style profiles
CREATE TABLE "JobStyleProfile" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "jobId" TEXT NOT NULL UNIQUE,
  "selectionMode" TEXT,
  "catalogItemId" TEXT,
  "uploadedImageUrl" TEXT,
  "uploadedImagePath" TEXT,
  "notes" TEXT,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "JobStyleProfile_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE,
  CONSTRAINT "JobStyleProfile_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem" ("id") ON DELETE SET NULL
);

CREATE INDEX "JobStyleProfile_jobId_idx" ON "JobStyleProfile" ("jobId");
CREATE INDEX "JobStyleProfile_catalogItemId_idx" ON "JobStyleProfile" ("catalogItemId");
