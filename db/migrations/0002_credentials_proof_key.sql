ALTER TABLE "credentials" DROP CONSTRAINT "credentials_kind_name_issued_on_key";--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_kind_proof_key" UNIQUE("kind","proof");