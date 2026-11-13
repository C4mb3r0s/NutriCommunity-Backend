import { and, asc, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { comments } from '../db/schema/comments.js'
import { posts } from '../db/schema/posts.js'

export const listByPost = async (postId: string) => {
  return db
    .select()
    .from(comments)
    .where(and(
      eq(comments.postId, postId),
      eq(comments.status, 'active')
    ))
    .orderBy(asc(comments.createdAt))
}

export const create = async (
  postId: string,
  userId: string,
  body: string
) => {
  const [publshedPost] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(
      eq(posts.id, postId),
      eq(posts.status, 'published')
    ))
    .limit(1)

  if (!publshedPost) return null

  const [comment] = await db
    .insert(comments)
    .values({ postId, userId, body })
    .returning()

  return comment
}

export const softDelete = async (
  commentId: string,
  userId: string,
  isAdmin: boolean
) => {
  const ownershipCondition = isAdmin
    ? eq(comments.id, commentId)
    : and(
      eq(comments.id, commentId),
      eq(comments.userId, userId)
    )

  const [comment] = await db
    .update(comments)
    .set({ status: 'deleted', updatedAt: new Date() })
    .where(ownershipCondition)
    .returning()

  return comment
}
