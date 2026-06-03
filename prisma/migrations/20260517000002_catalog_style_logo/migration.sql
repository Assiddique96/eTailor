-- StyleSelectionMode enum
CREATE TYPE "StyleSelectionMode" AS ENUM ('CATALOG', 'UPLOAD', 'IMPRESS_ME');

-- Shop: add logoUrl
ALTER TABLE "Shop" ADD COLUMN "logoUrl" TEXT;

-- Customer: drop old free-text style columns
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "preferredStyle";
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "preferredFit";

-- CatalogCategory
CREATE TABLE "CatalogCategory" (
    "id"          TEXT NOT NULL,
    "shopId"      TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "sortOrder"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CatalogCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CatalogCategory_shopId_name_key" ON "CatalogCategory"("shopId","name");
CREATE INDEX "CatalogCategory_shopId_sortOrder_idx" ON "CatalogCategory"("shopId","sortOrder");
ALTER TABLE "CatalogCategory" ADD CONSTRAINT "CatalogCategory_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CatalogItem
CREATE TABLE "CatalogItem" (
    "id"          TEXT NOT NULL,
    "shopId"      TEXT NOT NULL,
    "categoryId"  TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "imageUrl"    TEXT NOT NULL,
    "imagePath"   TEXT NOT NULL,
    "tags"        TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "sortOrder"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CatalogItem_shopId_categoryId_idx" ON "CatalogItem"("shopId","categoryId");
CREATE INDEX "CatalogItem_categoryId_sortOrder_idx" ON "CatalogItem"("categoryId","sortOrder");
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "CatalogCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 1. Create the clean CustomerStyleProfile table matching your exact prisma file layout
CREATE TABLE "CustomerStyleProfile" (
    "id"                  TEXT NOT NULL,
    "jobId"               TEXT NOT NULL,
    "selectionMode"       "StyleSelectionMode",
    "catalogItemId"       TEXT,
    "uploadedImageUrl"    TEXT,
    "uploadedImagePath"   TEXT,
    "notes"               TEXT,
    "updatedAt"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerStyleProfile_pkey" PRIMARY KEY ("id")
);

-- 2. Create the required Unique constraint on jobId so the 1-to-1 relationship behaves properly
CREATE UNIQUE INDEX "CustomerStyleProfile_jobId_key" ON "CustomerStyleProfile"("jobId");

-- 3. Create the lookup Index optimization
CREATE INDEX "CustomerStyleProfile_jobId_idx" ON "CustomerStyleProfile"("jobId");

-- 4. Apply Foreign Key constraints pointing to Job and CatalogItem tables
ALTER TABLE "CustomerStyleProfile" ADD CONSTRAINT "CustomerStyleProfile_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerStyleProfile" ADD CONSTRAINT "CustomerStyleProfile_catalogItemId_fkey"
    FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;