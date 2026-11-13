// Connects publications with their filtering and classification tags.
import {
  index,
  pgTable,
  primaryKey,
  uuid
} from 'drizzle-orm/pg-core'
import { posts } from './posts.js'
import { tags } from './tags.js'

export const postTags = pgTable(
  'post_tags',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, {
        onDelete: 'cascade'
      }),

    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id)
  },
  (table) => [
    primaryKey({
      columns: [table.postId, table.tagId]
    }),
    index('post_tags_tag_post_idx').on(table.tagId, table.postId)
  ]
)
