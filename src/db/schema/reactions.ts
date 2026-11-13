// Stores one active reaction per user and publication.
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'
import { posts } from './posts.js'
import { users } from './users.js'

export const reactions = pgTable(
  'reactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, {
        onDelete: 'cascade'
      }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade'
      }),

    type: varchar('type', {
      length: 10
    }).notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true
    }).defaultNow().notNull()
  },
  (table) => [
    unique('reactions_post_user_unique').on(table.postId, table.userId),
    check(
      'reactions_type_check',
      sql`${table.type} in ('like', 'love', 'amaze')`
    ),
    index('reactions_post_type_idx').on(table.postId, table.type)
  ]
)
