ALTER TABLE "users" ADD COLUMN "first_name" varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "second_name" varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "second_last_name" varchar(80);--> statement-breakpoint
WITH normalized_users AS (
  SELECT
    id,
    regexp_split_to_array(trim(name), '\s+') AS name_parts
  FROM users
)
UPDATE users AS target
SET
  first_name = source.name_parts[1],
  second_name = CASE
    WHEN cardinality(source.name_parts) >= 3 THEN source.name_parts[2]
    ELSE NULL
  END,
  last_name = CASE
    WHEN cardinality(source.name_parts) >= 3 THEN source.name_parts[3]
    WHEN cardinality(source.name_parts) = 2 THEN source.name_parts[2]
    ELSE source.name_parts[1]
  END,
  second_last_name = CASE
    WHEN cardinality(source.name_parts) >= 4 THEN array_to_string(
      source.name_parts[4:cardinality(source.name_parts)],
      ' '
    )
    ELSE NULL
  END
FROM normalized_users AS source
WHERE target.id = source.id;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "name";
