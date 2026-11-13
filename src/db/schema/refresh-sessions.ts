import {
  index,
  pgTable,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const refreshSessions = pgTable(
  'refresh_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade'
      }),

    tokenJti: uuid('token_jti').notNull().unique(),

    tokenHash: varchar('token_hash', {
      length: 64
    }).notNull(),

    expiresAt: timestamp('expires_at', {
      withTimezone: true
    }).notNull(),

    revokedAt: timestamp('revoked_at', {
      withTimezone: true
    }),

    replaceBy: uuid('replace_by'),

    userAgent: varchar('ip_address', {
      length: 45
    }),

    createdAt: timestamp('created_at', {
      withTimezone: true
    }).defaultNow().notNull(),

    lastUsedAt: timestamp('last_used_at', {
      withTimezone: true
    })
  }, (table) => [
    index('refresh_sessions_user_id_idx').on(table.userId),
    index('refresh_sessions_token_jti_idx').on(table.tokenJti)
  ]
)
