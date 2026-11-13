import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { posts } from '../db/schema/posts.js'
import type {
  CreatePostInput,
  UpdatePostInput
} from '../schemas/post.schema.js'

export const listPublished = async (page: number, limit: number) => {
  const offset = (page - 1) * limit

  const data = await db
    .select()
    .from(posts)
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset)

  return {
    data,
    pagination: {
      page,
      limit,
      total: data.length,
      totalPages: data.length === limit ? page + 1 : page
    }
  }
}

export const findById = async (postId: string) => {
  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1)

  return post
}

export const create = async (
  input: CreatePostInput,
  authorId: string
) => {
  const [post] = await db
    .insert(posts)
    .values({
      ...input,
      authorId,
      description: input.description ?? null,
      status: 'draft'
    })
    .returning()

  return post
}

export const update = async (
  postId: string,
  input: UpdatePostInput
) => {
  const values = {
    ...input,
    publishedAt: input.status === 'published' ? new Date() : undefined,
    updatedAt: new Date()
  }

  const [post] = await db
    .update(posts)
    .set(values)
    .where(eq(posts.id, postId))
    .returning()

  return post
}

export const softDelete = async (postId: string) => {
  const [post] = await db
    .update(posts)
    .set({
      status: 'deleted',
      updatedAt: new Date()
    })
    .where(eq(posts.id, postId))
    .returning()

  return post
}

export const canManage = async (
  postId: string,
  userId: string,
  isAdmin: boolean
) => {
  if (isAdmin) return true

  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.authorId, userId)))
    .limit(1)

  return Boolean(post)
}
