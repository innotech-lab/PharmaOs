ALTER TABLE "Pharmacy" ADD COLUMN "saleCounter" INTEGER NOT NULL DEFAULT 0;
DROP INDEX "Sale_number_key";

WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "pharmacyId" ORDER BY "createdAt", "id")::INTEGER AS "newNumber"
  FROM "Sale"
)
UPDATE "Sale" AS sale
SET "number" = numbered."newNumber"
FROM numbered
WHERE sale."id" = numbered."id";

UPDATE "Pharmacy" AS pharmacy
SET "saleCounter" = COALESCE((
  SELECT MAX(sale."number") FROM "Sale" AS sale WHERE sale."pharmacyId" = pharmacy."id"
), 0);

UPDATE "StockMovement" AS movement
SET "reason" = regexp_replace(movement."reason", '(Vente n° |Annulation de la vente n° )[0-9]+', E'\\1' || sale."number"::TEXT)
FROM "Sale" AS sale
WHERE movement."reference" = sale."id"
  AND movement."reason" ~ '(Vente n° |Annulation de la vente n° )[0-9]+';

ALTER TABLE "Sale" ALTER COLUMN "number" DROP DEFAULT;
CREATE UNIQUE INDEX "Sale_pharmacyId_number_key" ON "Sale"("pharmacyId", "number");
DROP SEQUENCE IF EXISTS "Sale_number_seq";
