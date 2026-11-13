// Stores the reusable ingredient catalog.
import {
  pgTable,
  text,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

export const ingredients = pgTable('ingredients', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: varchar('name', {
    length: 150
  }).notNull(),

  normalizedName: varchar('normalized_name', {
    length: 150
  }).notNull().unique(),

  description: text('description')
})
