// Connects recipes with ingredients, quantities, units, and display order.
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'
import { ingredients } from './ingredients.js'
import { posts } from './posts.js'
import { units } from './units.js'

export const recipeIngredients = pgTable(
  'recipe_ingredients',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, {
        onDelete: 'cascade'
      }),

    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => ingredients.id),

    quantity: numeric('quantity', {
      precision: 10,
      scale: 3
    }).notNull(),

    unitId: uuid('unit_id')
      .notNull()
      .references(() => units.id),

    notes: varchar('notes', {
      length: 180
    }),

    sortOrder: smallint('sort_order').notNull()
  },
  (table) => [
    primaryKey({
      columns: [table.postId, table.ingredientId]
    }),
    index('recipe_ingredients_ingredient_idx').on(table.ingredientId),
    check(
      'recipe_ingredients_quantity_check',
      sql`${table.quantity} > 0`
    )
  ]
)
