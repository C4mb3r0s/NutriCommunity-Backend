// Stores the ordered preparation instructions for a recipe.
import {
  pgTable,
  smallint,
  text,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'
import { posts } from './posts.js'

export const recipeSteps = pgTable(
  'recipe_steps',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, {
        onDelete: 'cascade'
      }),

    stepNumber: smallint('step_number').notNull(),
    instruction: text('instruction').notNull()
  },
  (table) => [
    uniqueIndex('recipe_steps_post_step_idx').on(
      table.postId,
      table.stepNumber
    )
  ]
)
