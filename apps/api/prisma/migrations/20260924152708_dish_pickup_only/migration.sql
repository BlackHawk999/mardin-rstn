-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dish" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER NOT NULL,
    "nameUz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "descriptionUz" TEXT,
    "descriptionRu" TEXT,
    "ingredientsUz" TEXT,
    "ingredientsRu" TEXT,
    "imageUrl" TEXT,
    "price" INTEGER NOT NULL,
    "weight" TEXT,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "isHit" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "pickupOnly" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dish_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Dish" ("categoryId", "createdAt", "descriptionRu", "descriptionUz", "id", "imageUrl", "ingredientsRu", "ingredientsUz", "isAvailable", "isHidden", "isHit", "isNew", "nameRu", "nameUz", "price", "sortOrder", "updatedAt", "weight") SELECT "categoryId", "createdAt", "descriptionRu", "descriptionUz", "id", "imageUrl", "ingredientsRu", "ingredientsUz", "isAvailable", "isHidden", "isHit", "isNew", "nameRu", "nameUz", "price", "sortOrder", "updatedAt", "weight" FROM "Dish";
DROP TABLE "Dish";
ALTER TABLE "new_Dish" RENAME TO "Dish";
CREATE INDEX "Dish_categoryId_idx" ON "Dish"("categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
