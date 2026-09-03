-- AlterTable
ALTER TABLE "distributor_profiles" ADD COLUMN     "bank_account_number" VARCHAR(40),
ADD COLUMN     "bank_branch" VARCHAR(120),
ADD COLUMN     "bank_ifsc" VARCHAR(20),
ADD COLUMN     "bank_name" VARCHAR(120),
ADD COLUMN     "cin" VARCHAR(30);
