CREATE TABLE "camps" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "children" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_number" text NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" text NOT NULL,
	"gender" text NOT NULL,
	"health_status" text NOT NULL,
	"father_name" text NOT NULL,
	"father_id" text NOT NULL,
	"mother_name" text NOT NULL,
	"mother_id" text NOT NULL,
	"mother_date_of_birth" text,
	"is_breastfeeding" boolean DEFAULT false,
	"mother_health_status" text,
	"contact_number" text,
	"notes" text,
	"camp_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "children_id_number_unique" UNIQUE("id_number")
);
--> statement-breakpoint
CREATE TABLE "pregnant_women" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_number" text NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" text,
	"health_status" text NOT NULL,
	"pregnancy_month" integer NOT NULL,
	"spouse_name" text NOT NULL,
	"spouse_id" text NOT NULL,
	"contact_number" text,
	"notes" text,
	"camp_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "pregnant_women_id_number_unique" UNIQUE("id_number")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar,
	"password" varchar,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");