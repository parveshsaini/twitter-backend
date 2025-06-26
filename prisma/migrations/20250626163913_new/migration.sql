-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "createdAt" SET DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS');

-- AlterTable
ALTER TABLE "_ConversationToUser" ADD CONSTRAINT "_ConversationToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ConversationToUser_AB_unique";
