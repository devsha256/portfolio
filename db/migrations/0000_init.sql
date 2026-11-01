CREATE TABLE "admin_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"github_login" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"body_md" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_key" UNIQUE("slug"),
	CONSTRAINT "posts_status_check" CHECK ("posts"."status" in ('draft', 'published')),
	CONSTRAINT "posts_published_at_check" CHECK ("posts"."status" = 'draft' or "posts"."published_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "projects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"company" text NOT NULL,
	"start_month" date NOT NULL,
	"end_month" date,
	"description" text NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_company_start_month_key" UNIQUE("company","start_month"),
	CONSTRAINT "projects_period_check" CHECK ("projects"."end_month" is null or "projects"."end_month" >= "projects"."start_month")
);
--> statement-breakpoint
CREATE INDEX "admin_sessions_expires_at_idx" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "posts_published_at_idx" ON "posts" USING btree ("published_at" DESC NULLS LAST) WHERE "posts"."status" = 'published';--> statement-breakpoint
CREATE INDEX "posts_tags_idx" ON "posts" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "projects_start_month_idx" ON "projects" USING btree ("start_month" DESC NULLS LAST);