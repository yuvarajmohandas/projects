-- CreateTable
CREATE TABLE "HomepageLayout" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "headerOrder" TEXT NOT NULL DEFAULT '["logo","name","navigation","cart"]',
    "headerAlignment" TEXT NOT NULL DEFAULT 'left',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HomepageSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "layoutId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "content" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HomepageSection_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "HomepageLayout" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "HomepageSection_layoutId_sortOrder_idx" ON "HomepageSection"("layoutId", "sortOrder");
