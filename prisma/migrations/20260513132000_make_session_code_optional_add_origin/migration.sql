CREATE TYPE "SessionOrigin" AS ENUM ('customer', 'customerService');

ALTER TABLE "TroubleshootingSession"
ADD COLUMN "origin" "SessionOrigin" NOT NULL DEFAULT 'customer';

ALTER TABLE "TroubleshootingSession"
ALTER COLUMN "sessionCode" DROP NOT NULL;

DROP INDEX IF EXISTS "TroubleshootingSession_sessionCode_key";

CREATE INDEX "TroubleshootingSession_sessionCode_idx"
ON "TroubleshootingSession"("sessionCode");
