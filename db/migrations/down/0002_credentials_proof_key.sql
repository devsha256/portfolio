-- Reverses 0002_credentials_proof_key. Run before down/0001 (newest first).
-- Restoring the old key fails if two credentials share kind, name and date; that is intended,
-- so no certificate is silently dropped. Remove or rename such rows by hand first.
ALTER TABLE "credentials" DROP CONSTRAINT IF EXISTS "credentials_kind_proof_key";
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_kind_name_issued_on_key" UNIQUE ("kind", "name", "issued_on");
DELETE FROM "drizzle"."__drizzle_migrations" WHERE "created_at" = 1793585942286;
