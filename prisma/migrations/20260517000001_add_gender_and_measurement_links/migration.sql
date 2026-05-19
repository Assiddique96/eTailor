-- CreateEnum: Gender
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable: Customer.gender String? → Gender?
-- First add as nullable to avoid locking existing rows
ALTER TABLE "Customer" ADD COLUMN "gender_new" "Gender";
UPDATE "Customer" SET "gender_new" = CAST("gender" AS "Gender") WHERE "gender" IN ('MALE','FEMALE','OTHER');
ALTER TABLE "Customer" DROP COLUMN "gender";
ALTER TABLE "Customer" RENAME COLUMN "gender_new" TO "gender";

-- CreateTable: MeasurementLink
CREATE TABLE "MeasurementLink" (
    "id"         TEXT NOT NULL,
    "token"      TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "shopId"     TEXT NOT NULL,
    "gender"     "Gender" NOT NULL,
    "expiresAt"  TIMESTAMP(3) NOT NULL,
    "usedAt"     TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeasurementLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MeasurementLink_token_key" ON "MeasurementLink"("token");
CREATE INDEX "MeasurementLink_token_idx"      ON "MeasurementLink"("token");
CREATE INDEX "MeasurementLink_customerId_idx" ON "MeasurementLink"("customerId");

ALTER TABLE "MeasurementLink"
    ADD CONSTRAINT "MeasurementLink_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MeasurementLink"
    ADD CONSTRAINT "MeasurementLink_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
