// Stores publication comments and their moderation status.
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'
import { posts } from './posts.js'
import { users } from './users.js'

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, {
        onDelete: 'cascade'
      }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    body: text('body').notNull(),

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
    check(
      'comments_status_check',
      sql`${table.status} in ('active', 'deleted', 'moderated')`
    ),
    index('comments_post_created_at_idx').on(
      table.postId,
      table.createdAt
    )
  ]
)
