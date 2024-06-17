-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "createdAt" SET DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
ALTER COLUMN "createdAt" SET DATA TYPE TEXT;
