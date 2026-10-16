CREATE TABLE "WebConversation" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebConversation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WebMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "sender" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebMessage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WebConversation_tokenHash_key" ON "WebConversation"("tokenHash");
CREATE INDEX "WebConversation_updatedAt_idx" ON "WebConversation"("updatedAt");
CREATE INDEX "WebMessage_conversationId_createdAt_idx" ON "WebMessage"("conversationId", "createdAt");
ALTER TABLE "WebMessage" ADD CONSTRAINT "WebMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WebConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
