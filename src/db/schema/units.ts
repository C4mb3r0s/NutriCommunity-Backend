// Stores measurement units used by recipe ingredients.
import { sql } from 'drizzle-orm'
import {
  check,
  pgTable,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

export const units = pgTable(
  'units',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    code: varchar('code', {
      length: 20
    }).notNull().unique(),

    name: varchar('name', {
      length: 60
    }).notNull(),

    dimension: varchar('dimension', {
      length: 20
    }).notNull()
  },
  (table) => [
    check(
      'units_dimension_check',
      sql`${table.dimension} in ('mass', 'volume', 'count', 'spoon', 'other')`
    )
  ]
)
