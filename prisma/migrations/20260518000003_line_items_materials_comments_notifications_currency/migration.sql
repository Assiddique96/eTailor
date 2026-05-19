-- Shop: currency, bankDetails, paymentTerms
ALTER TABLE "Shop" ADD COLUMN "currency"     TEXT NOT NULL DEFAULT 'NGN';
ALTER TABLE "Shop" ADD COLUMN "bankDetails"  TEXT;
ALTER TABLE "Shop" ADD COLUMN "paymentTerms" TEXT;

-- CatalogItem: gender array
ALTER TABLE "CatalogItem" ADD COLUMN "gender" "Gender"[] DEFAULT ARRAY[]::"Gender"[];

-- Job: deposit fields
ALTER TABLE "Job" ADD COLUMN "depositAmount"  DECIMAL(10,2);
ALTER TABLE "Job" ADD COLUMN "depositPaidAt"  TIMESTAMP(3);

-- JobComment
CREATE TABLE "JobComment" (
    "id"        TEXT NOT NULL,
    "jobId"     TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "JobComment_jobId_createdAt_idx" ON "JobComment"("jobId","createdAt");
ALTER TABLE "JobComment" ADD CONSTRAINT "JobComment_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobComment" ADD CONSTRAINT "JobComment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- JobMaterial
CREATE TABLE "JobMaterial" (
    "id"             TEXT NOT NULL,
    "jobId"          TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "colour"         TEXT,
    "quantityMetres" DECIMAL(8,2),
    "unitCost"       DECIMAL(10,2),
    "totalCost"      DECIMAL(10,2),
    "supplier"       TEXT,
    "notes"          TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobMaterial_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "JobMaterial_jobId_idx" ON "JobMaterial"("jobId");
ALTER TABLE "JobMaterial" ADD CONSTRAINT "JobMaterial_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- InvoiceLine
CREATE TABLE "InvoiceLine" (
    "id"          TEXT NOT NULL,
    "invoiceId"   TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity"    DECIMAL(8,2)  NOT NULL DEFAULT 1,
    "unitPrice"   DECIMAL(10,2) NOT NULL,
    "amount"      DECIMAL(10,2) NOT NULL,
    "sortOrder"   INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notification: update to full model
ALTER TABLE "Notification" ADD COLUMN "userId"     TEXT;
ALTER TABLE "Notification" ADD COLUMN "type"       TEXT NOT NULL DEFAULT 'INFO';
ALTER TABLE "Notification" ADD COLUMN "entityId"   TEXT;
ALTER TABLE "Notification" ADD COLUMN "entityType" TEXT;
ALTER TABLE "Notification" ADD COLUMN "isRead"     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Notification" ADD COLUMN "readAt"     TIMESTAMP(3);
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "targetDate";
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "isSent";
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "sentAt";

CREATE INDEX "Notification_shopId_isRead_createdAt_idx" ON "Notification"("shopId","isRead","createdAt");
CREATE INDEX "Notification_userId_isRead_idx"           ON "Notification"("userId","isRead");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
