/*
  Warnings:

  - You are about to drop the column `image_urls` on the `water_reports` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "water_reports" DROP COLUMN "image_urls",
ADD COLUMN     "image_base64_data" TEXT[] DEFAULT ARRAY[]::TEXT[];
