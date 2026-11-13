// Stores configurable goals, conditions, allergens, preferences, and categories.
import { sql } from 'drizzle-orm'
import {
  check,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    type: varchar('type', {
      length: 20
    }).notNull(),

    code: varchar('code', {
      length: 60
    }).notNull(),

    name: varchar('name', {
      length: 100
    }).notNull(),

    status: varchar('status', {
      length: 20
    }).notNull().default('active'),

    createdAt: timestamp('created_at', {
      withTimezone: true
    }).defaultNow().notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true
    }).defaultNow().notNull()
  },
  (table) => [
    unique('tags_type_code_unique').on(table.type, table.code),
    check(
      'tags_type_check',
      sql`${table.type} in ('goal', 'condition', 'allergen', 'preference', 'category')`
    ),
    check(
      'tags_status_check',
      sql`${table.status} in ('active', 'inactive')`
    )
  ]
)
