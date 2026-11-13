// Stores recipe-specific serving and preparation details.
import { sql } from 'drizzle-orm'
import {
  check,
  pgTable,
  smallint,
  timestamp,
  uuid
} from 'drizzle-orm/pg-core'
import { posts } from './posts.js'

export const recipeDetails = pgTable(
  'recipe_details',
  {
    postId: uuid('post_id')
      .primaryKey()
      .references(() => posts.id, {
        onDelete: 'cascade'
      }),

    servings: smallint('servings').notNull(),
    prepMinutes: smallint('prep_minutes'),
    cookMinutes: smallint('cook_minutes'),

    createdAt: timestamp('created_at', {
      withTimezone: true
    }).defaultNow().notNull()
  },
  (table) => [
    check('recipe_details_servings_check', sql`${table.servings} > 0`),
    check(
      'recipe_details_prep_minutes_check',
      sql`${table.prepMinutes} is null or ${table.prepMinutes} >= 0`
    ),
    check(
      'recipe_details_cook_minutes_check',
      sql`${table.cookMinutes} is null or ${table.cookMinutes} >= 0`
    )
  ]
)
