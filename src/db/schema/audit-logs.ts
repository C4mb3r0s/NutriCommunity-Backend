// Stores traceable administrative and publication-related actions.
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'
import { posts } from './posts.js'
import { users } from './users.js'

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    actorId: uuid('actor_id').references(() => users.id, {
      onDelete: 'set null'
    }),

    postId: uuid('post_id').references(() => posts.id, {
      onDelete: 'set null'
    }),

    action: varchar('action', {
      length: 50
    }).notNull(),

    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at', {
      withTimezone: true
    }).defaultNow().notNull()
  },
  (table) => [
    index('audit_logs_actor_created_at_idx').on(
      table.actorId,
      table.createdAt
    ),
    index('audit_logs_post_created_at_idx').on(
      table.postId,
      table.createdAt
    )
  ]
)
