// Stores account identity, credentials, and lifecycle status.
import {
  check,
  pgTable,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    name: varchar('name', {
      length: 120
    }).notNull(),

    email: varchar('email', {
      length: 255
    }).notNull().unique(),

    passwordHash: varchar('password_hash', {
      length: 255
    }).notNull(),

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
      'users_status_check',
      sql`${table.status} in ('active', 'suspended', 'deleted')`
    )
  ]
)
