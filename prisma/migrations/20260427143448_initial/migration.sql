-- CreateEnum
CREATE TYPE "Role" AS ENUM ('AGENT', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "SessionOutcome" AS ENUM ('IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "TerminalReason" AS ENUM ('EXTERNAL_REDIRECT', 'FLOW_EXIT_EXPECTED_SPEED', 'FLOW_EXIT_NO_NEXT_STEP', 'FILTERED_CROSS_FLOW');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ingress" TEXT,
    "categoryId" TEXT NOT NULL,
    "deviceTypeId" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "localeKey" TEXT NOT NULL,
    "agentNote" TEXT,
    "imageUrl" TEXT,
    "articleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepChoice" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "buttonText" TEXT,
    "value" TEXT,
    "nextStepId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "terminalReason" "TerminalReason",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StepChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionStepAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "choiceId" TEXT,
    "customText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionStepAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TroubleshootingSession" (
    "id" TEXT NOT NULL,
    "sessionCode" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "outcome" "SessionOutcome" NOT NULL DEFAULT 'IN_PROGRESS',
    "escalationReason" TEXT,
    "routerModel" TEXT,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TroubleshootingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceType_slug_key" ON "DeviceType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");

-- CreateIndex
CREATE INDEX "Article_deviceTypeId_idx" ON "Article"("deviceTypeId");

-- CreateIndex
CREATE INDEX "Step_articleId_idx" ON "Step"("articleId");

-- CreateIndex
CREATE INDEX "StepChoice_nextStepId_idx" ON "StepChoice"("nextStepId");

-- CreateIndex
CREATE UNIQUE INDEX "StepChoice_stepId_sortOrder_key" ON "StepChoice"("stepId", "sortOrder");

-- CreateIndex
CREATE INDEX "SessionStepAnswer_choiceId_idx" ON "SessionStepAnswer"("choiceId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionStepAnswer_sessionId_stepId_key" ON "SessionStepAnswer"("sessionId", "stepId");

-- CreateIndex
CREATE UNIQUE INDEX "TroubleshootingSession_sessionCode_key" ON "TroubleshootingSession"("sessionCode");

-- CreateIndex
CREATE INDEX "TroubleshootingSession_articleId_idx" ON "TroubleshootingSession"("articleId");

-- CreateIndex
CREATE INDEX "TroubleshootingSession_outcome_idx" ON "TroubleshootingSession"("outcome");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_deviceTypeId_fkey" FOREIGN KEY ("deviceTypeId") REFERENCES "DeviceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepChoice" ADD CONSTRAINT "StepChoice_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepChoice" ADD CONSTRAINT "StepChoice_nextStepId_fkey" FOREIGN KEY ("nextStepId") REFERENCES "Step"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionStepAnswer" ADD CONSTRAINT "SessionStepAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TroubleshootingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionStepAnswer" ADD CONSTRAINT "SessionStepAnswer_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionStepAnswer" ADD CONSTRAINT "SessionStepAnswer_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "StepChoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TroubleshootingSession" ADD CONSTRAINT "TroubleshootingSession_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TroubleshootingSession" ADD CONSTRAINT "TroubleshootingSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
