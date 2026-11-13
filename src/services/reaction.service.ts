import { and, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { posts } from '../db/schema/posts.js'
import { reactions } from '../db/schema/reactions.js'

export const toggle = async (
  postId: string,
  userId: string,
  type: 'like' | 'love' | 'amaze'
) => {
  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(
      eq(posts.id, postId),
      eq(posts.status, 'published')))
    .limit(1)

  if (!post) return null

  const [existing] = await db
    .select()
    .from(reactions)
    .where(and(
      eq(reactions.postId, postId),
      eq(reactions.userId, userId)
    ))
    .limit(1)

  if (existing?.type === type) {
    await db.delete(reactions).where(eq(reactions.id, existing.id))
    return null
  }

  if (existing) {
    const [updated] = await db
      .update(reactions)
      .set({ type })
      .where(eq(reactions.id, existing.id))
      .returning()
    return updated
  }

  const [created] = await db
    .insert(reactions)
    .values({ postId, userId, type })
    .returning()
  return created
}
