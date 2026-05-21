/*
  Warnings:

  - You are about to drop the column `description` on the `Court` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `Court` table. All the data in the column will be lost.
  - You are about to drop the column `spots` on the `Court` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Court" DROP COLUMN "description",
DROP COLUMN "isDefault",
DROP COLUMN "spots",
ADD COLUMN     "spotsConfig" TEXT NOT NULL DEFAULT '{"spots":[]}',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
