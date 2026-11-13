// Stores user tag preferences, including exclusions and preferred tags.
import { sql } from 'drizzle-orm'
import {
  check,
  pgTable,
  primaryKey,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'
import { tags } from './tags.js'
import { users } from './users.js'

export const userPreferences = pgTable(
  'user_preferences',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade'
      }),

    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id),

    mode: varchar('mode', {
      length: 20
    }).notNull()
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.tagId]
    }),
    check(
      'user_preferences_mode_check',
      sql`${table.mode} in ('exclude', 'prefer')`
    )
  ]
)
