-- Reverses 0001_admin_content. Destructive: drops all credentials and the site profile.
-- Run only against a local or branch database, then `npm run db:migrate` re-applies 0001.
-- Deleting the journal row is what lets Drizzle's migrator apply 0001 again
-- (created_at holds the `when` of 0001 in db/migrations/meta/_journal.json).
DROP TABLE IF EXISTS "site_profile";
DROP TABLE IF EXISTS "credentials";
DELETE FROM "drizzle"."__drizzle_migrations" WHERE "created_at" = 1793581652586;
