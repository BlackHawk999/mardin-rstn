-- AlterTable
ALTER TABLE "Address" ADD COLUMN "label" TEXT;

-- AlterTable
ALTER TABLE "Banner" ADD COLUMN "subtitleRu" TEXT;
ALTER TABLE "Banner" ADD COLUMN "subtitleUz" TEXT;
ALTER TABLE "Banner" ADD COLUMN "titleRu" TEXT;
ALTER TABLE "Banner" ADD COLUMN "titleUz" TEXT;

-- AlterTable
ALTER TABLE "Dish" ADD COLUMN "ingredientsRu" TEXT;
ALTER TABLE "Dish" ADD COLUMN "ingredientsUz" TEXT;
