// Defines the roles available for authorization.
import {
  check,
  pgTable,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    code: varchar('code', {
      length: 20
    }).notNull().unique(),

    name: varchar('name', {
      length: 80
    }).notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true
    }).defaultNow().notNull()
  },
  (table) => [
    check(
      'roles_code_check',
      sql`${table.code} in ('admin', 'participant')`
    )
  ]
)
