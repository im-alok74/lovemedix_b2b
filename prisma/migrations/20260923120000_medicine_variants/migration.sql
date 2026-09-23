-- CreateTable
CREATE TABLE "medicine_variants" (
    "id" SERIAL NOT NULL,
    "medicine_id" INTEGER NOT NULL,
    "size" VARCHAR(100) NOT NULL,
    "sku" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicine_variants_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "distributor_listings" ADD COLUMN "variant_id" INTEGER;

-- DropIndex
DROP INDEX "distributor_listings_distributor_id_medicine_id_batch_numbe_key";

-- CreateIndex
CREATE UNIQUE INDEX "medicine_variants_medicine_id_size_key" ON "medicine_variants"("medicine_id", "size");
CREATE UNIQUE INDEX "medicine_variants_medicine_id_sku_key" ON "medicine_variants"("medicine_id", "sku");
CREATE INDEX "medicine_variants_medicine_id_is_active_idx" ON "medicine_variants"("medicine_id", "is_active");
CREATE UNIQUE INDEX "distributor_listings_distributor_id_medicine_id_variant_id_batch_number_key" ON "distributor_listings"("distributor_id", "medicine_id", "variant_id", "batch_number");
CREATE INDEX "distributor_listings_variant_id_idx" ON "distributor_listings"("variant_id");

-- AddForeignKey
ALTER TABLE "medicine_variants" ADD CONSTRAINT "medicine_variants_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "distributor_listings" ADD CONSTRAINT "distributor_listings_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "medicine_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;