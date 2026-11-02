CREATE TABLE "credentials" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "credentials_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"authority" text NOT NULL,
	"issued_on" date NOT NULL,
	"credential_id" text,
	"image" text NOT NULL,
	"link" text,
	"proof" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credentials_kind_name_issued_on_key" UNIQUE("kind","name","issued_on"),
	CONSTRAINT "credentials_kind_check" CHECK ("credentials"."kind" in ('certification', 'feedback', 'learning')),
	CONSTRAINT "credentials_image_check" CHECK ("credentials"."image" like '/img/%')
);
--> statement-breakpoint
CREATE TABLE "site_profile" (
	"id" smallint PRIMARY KEY NOT NULL,
	"tagline" text NOT NULL,
	"career_start" date NOT NULL,
	"summary_md" text NOT NULL,
	"about_md" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_profile_id_check" CHECK ("site_profile"."id" = 1)
);
--> statement-breakpoint
CREATE INDEX "credentials_kind_issued_on_idx" ON "credentials" USING btree ("kind","issued_on" DESC NULLS LAST);