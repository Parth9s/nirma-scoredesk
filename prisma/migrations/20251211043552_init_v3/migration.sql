-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "data" TEXT NOT NULL,
    "submittedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Contribution" ("createdAt", "data", "id", "status", "submittedBy", "type") SELECT "createdAt", "data", "id", "status", "submittedBy", "type" FROM "Contribution";
DROP TABLE "Contribution";
ALTER TABLE "new_Contribution" RENAME TO "Contribution";
CREATE TABLE "new_EvaluationConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subjectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "maxMarks" INTEGER NOT NULL DEFAULT 100,
    "rules" TEXT,
    CONSTRAINT "EvaluationConfig_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EvaluationConfig" ("id", "maxMarks", "rules", "subjectId", "type", "weight") SELECT "id", "maxMarks", "rules", "subjectId", "type", "weight" FROM "EvaluationConfig";
DROP TABLE "EvaluationConfig";
ALTER TABLE "new_EvaluationConfig" RENAME TO "EvaluationConfig";
CREATE UNIQUE INDEX "EvaluationConfig_subjectId_type_key" ON "EvaluationConfig"("subjectId", "type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
