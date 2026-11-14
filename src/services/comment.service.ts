import { and, asc, count, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { comments } from '../db/schema/comments.js'
import { posts } from '../db/schema/posts.js'
import { users } from '../db/schema/users.js'

type CommentRow = {
  id: string
  postId: string
  userId: string
  body: string
  status: string
  createdAt: Date
  updatedAt: Date
  firstName: string
  secondName: string | null
  lastName: string
  secondLastName: string | null
}

const toCommentView = (comment: CommentRow) => ({
  id: comment.id,
  postId: comment.postId,
  userId: comment.userId,
  authorName: [
    comment.firstName,
    comment.secondName,
    comment.lastName,
    comment.secondLastName
  ].filter(Boolean).join(' '),
  body: comment.body,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt
})

export const listByPost = async (
  postId: string,
  page = 1,
  limit = 10
) => {
  const offset = (page - 1) * limit
  const whereCondition = and(
    eq(comments.postId, postId),
    eq(comments.status, 'active'),
    eq(posts.status, 'published')
  )

  const data = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      body: comments.body,
      status: comments.status,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      firstName: users.firstName,
      secondName: users.secondName,
      lastName: users.lastName,
      secondLastName: users.secondLastName
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(whereCondition)
    .orderBy(asc(comments.createdAt))
    .limit(limit)
    .offset(offset)

  const countResult = await db
    .select({ total: count() })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(whereCondition)

  const totalComments = Number(countResult[0]?.total ?? 0)

  return {
    data: data.map((comment) => toCommentView(comment as CommentRow)),
    pagination: {
      page,
      limit,
      total: totalComments,
      hasMore: offset + data.length < totalComments
    }
  }
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
