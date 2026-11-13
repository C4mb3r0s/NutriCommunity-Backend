CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"post_id" uuid,
	"action" varchar(50) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comments_status_check" CHECK ("comments"."status" in ('active', 'deleted', 'moderated'))
);
--> statement-breakpoint
CREATE TABLE "content_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_types_code_unique" UNIQUE("code"),
	CONSTRAINT "content_types_code_check" CHECK ("content_types"."code" in ('recipe', 'beverage', 'snack', 'colacion', 'dessert', 'sauce', 'guide'))
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"normalized_name" varchar(150) NOT NULL,
	"description" text,
	CONSTRAINT "ingredients_normalized_name_unique" UNIQUE("normalized_name")
);
--> statement-breakpoint
CREATE TABLE "nutrition_facts" (
	"post_id" uuid PRIMARY KEY NOT NULL,
	"calories" numeric(10, 2),
	"protein_g" numeric(10, 2),
	"carbs_g" numeric(10, 2),
	"fat_g" numeric(10, 2),
	"fiber_g" numeric(10, 2),
	"sodium_mg" numeric(10, 2),
	CONSTRAINT "nutrition_facts_non_negative_check" CHECK (
        ("nutrition_facts"."calories" is null or "nutrition_facts"."calories" >= 0)
        and ("nutrition_facts"."protein_g" is null or "nutrition_facts"."protein_g" >= 0)
        and ("nutrition_facts"."carbs_g" is null or "nutrition_facts"."carbs_g" >= 0)
        and ("nutrition_facts"."fat_g" is null or "nutrition_facts"."fat_g" >= 0)
        and ("nutrition_facts"."fiber_g" is null or "nutrition_facts"."fiber_g" >= 0)
        and ("nutrition_facts"."sodium_mg" is null or "nutrition_facts"."sodium_mg" >= 0)
      )
);
--> statement-breakpoint
CREATE TABLE "post_tags" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "post_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"content_type_id" uuid NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" varchar(2000),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_status_check" CHECK ("posts"."status" in ('draft', 'published', 'archived', 'deleted'))
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reactions_post_user_unique" UNIQUE("post_id","user_id"),
	CONSTRAINT "reactions_type_check" CHECK ("reactions"."type" in ('like', 'love', 'amaze'))
);
--> statement-breakpoint
CREATE TABLE "recipe_details" (
	"post_id" uuid PRIMARY KEY NOT NULL,
	"servings" smallint NOT NULL,
	"prep_minutes" smallint,
	"cook_minutes" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_details_servings_check" CHECK ("recipe_details"."servings" > 0),
	CONSTRAINT "recipe_details_prep_minutes_check" CHECK ("recipe_details"."prep_minutes" is null or "recipe_details"."prep_minutes" >= 0),
	CONSTRAINT "recipe_details_cook_minutes_check" CHECK ("recipe_details"."cook_minutes" is null or "recipe_details"."cook_minutes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"post_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit_id" uuid NOT NULL,
	"notes" varchar(180),
	"sort_order" smallint NOT NULL,
	CONSTRAINT "recipe_ingredients_post_id_ingredient_id_pk" PRIMARY KEY("post_id","ingredient_id"),
	CONSTRAINT "recipe_ingredients_quantity_check" CHECK ("recipe_ingredients"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "recipe_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"step_number" smallint NOT NULL,
	"instruction" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(20) NOT NULL,
	"code" varchar(60) NOT NULL,
	"name" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_type_code_unique" UNIQUE("type","code"),
	CONSTRAINT "tags_type_check" CHECK ("tags"."type" in ('goal', 'condition', 'allergen', 'preference', 'category')),
	CONSTRAINT "tags_status_check" CHECK ("tags"."status" in ('active', 'inactive'))
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(60) NOT NULL,
	"dimension" varchar(20) NOT NULL,
	CONSTRAINT "units_code_unique" UNIQUE("code"),
	CONSTRAINT "units_dimension_check" CHECK ("units"."dimension" in ('mass', 'volume', 'count', 'spoon', 'other'))
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"mode" varchar(20) NOT NULL,
	CONSTRAINT "user_preferences_user_id_tag_id_pk" PRIMARY KEY("user_id","tag_id"),
	CONSTRAINT "user_preferences_mode_check" CHECK ("user_preferences"."mode" in ('exclude', 'prefer'))
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_facts" ADD CONSTRAINT "nutrition_facts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_content_type_id_content_types_id_fk" FOREIGN KEY ("content_type_id") REFERENCES "public"."content_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_details" ADD CONSTRAINT "recipe_details_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_actor_created_at_idx" ON "audit_logs" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_post_created_at_idx" ON "audit_logs" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "comments_post_created_at_idx" ON "comments" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "post_tags_tag_post_idx" ON "post_tags" USING btree ("tag_id","post_id");--> statement-breakpoint
CREATE INDEX "posts_status_published_at_idx" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "posts_author_created_at_idx" ON "posts" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX "reactions_post_type_idx" ON "reactions" USING btree ("post_id","type");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_ingredient_idx" ON "recipe_ingredients" USING btree ("ingredient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_steps_post_step_idx" ON "recipe_steps" USING btree ("post_id","step_number");