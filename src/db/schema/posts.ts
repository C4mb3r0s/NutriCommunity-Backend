// Stores the common fields shared by recipes, guides, and other publications.
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'
import { contentTypes } from './content-types.js'
import { users } from './users.js'

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),

    contentTypeId: uuid('content_type_id')
      .notNull()
      .references(() => contentTypes.id),

    title: varchar('title', {
      length: 180
    }).notNull(),

    description: varchar('description', {
      length: 2000
    }),

    status: varchar('status', {
      length: 20
    }).notNull().default('draft'),

    publishedAt: timestamp('published_at', {
      withTimezone: true
    }),

    createdAt: timestamp('created_at', {
      withTimezone: true
    }).defaultNow().notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true
    }).defaultNow().notNull()
  },
  (table) => [
    check(
      'posts_status_check',
      sql`${table.status} in ('draft', 'published', 'archived', 'deleted')`
    ),
    index('posts_status_published_at_idx').on(
      table.status,
      table.publishedAt
    ),
    index('posts_author_created_at_idx').on(
      table.authorId,
      table.createdAt
    )
  ]
)
