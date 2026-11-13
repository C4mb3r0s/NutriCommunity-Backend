// Stores optional nutritional values per publication serving.
import { sql } from 'drizzle-orm'
import {
  check,
  numeric,
  pgTable,
  uuid
} from 'drizzle-orm/pg-core'
import { posts } from './posts.js'

export const nutritionFacts = pgTable(
  'nutrition_facts',
  {
    postId: uuid('post_id')
      .primaryKey()
      .references(() => posts.id, {
        onDelete: 'cascade'
      }),

    calories: numeric('calories', {
      precision: 10,
      scale: 2
    }),

    proteinG: numeric('protein_g', {
      precision: 10,
      scale: 2
    }),

    carbsG: numeric('carbs_g', {
      precision: 10,
      scale: 2
    }),

    fatG: numeric('fat_g', {
      precision: 10,
      scale: 2
    }),

    fiberG: numeric('fiber_g', {
      precision: 10,
      scale: 2
    }),

    sodiumMg: numeric('sodium_mg', {
      precision: 10,
      scale: 2
    })
  },
  (table) => [
    check(
      'nutrition_facts_non_negative_check',
      sql`
        (${table.calories} is null or ${table.calories} >= 0)
        and (${table.proteinG} is null or ${table.proteinG} >= 0)
        and (${table.carbsG} is null or ${table.carbsG} >= 0)
        and (${table.fatG} is null or ${table.fatG} >= 0)
        and (${table.fiberG} is null or ${table.fiberG} >= 0)
        and (${table.sodiumMg} is null or ${table.sodiumMg} >= 0)
      `
    )
  ]
)
