// Stores configurable publication types such as recipes and guides.
import { sql } from 'drizzle-orm'
import {
  check,
  pgTable,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

export const contentTypes = pgTable(
  'content_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    code: varchar('code', {
      length: 30
    }).notNull().unique(),

    name: varchar('name', {
      length: 80
    }).notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true
    }).defaultNow().notNull()
  },
  (table) => [
    check(
      'content_types_code_check',
      sql`${table.code} in ('recipe', 'beverage', 'snack', 'colacion', 'dessert', 'sauce', 'guide')`
    )
  ]
)
