-- CreateTable: Session (JWT revocation store)
CREATE TABLE "Session" (
    "id"        TEXT NOT NULL,
    "jti"       TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- Unique index for O(1) revocation lookups
CREATE UNIQUE INDEX "Session_jti_key" ON "Session"("jti");

-- Supporting indexes
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_jti_idx"    ON "Session"("jti");

-- Foreign key to User
ALTER TABLE "Session"
    ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
