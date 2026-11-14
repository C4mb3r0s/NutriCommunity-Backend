import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { contentTypes } from '../db/schema/content-types.js'
import { posts } from '../db/schema/posts.js'
import { users } from '../db/schema/users.js'
import type {
  CreatePostInput,
  UpdatePostInput
} from '../schemas/post.schema.js'

type PostRow = {
  id: string
  authorId: string
  contentTypeId: string
  title: string
  description: string | null
  status: string
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  authorFirstName: string
  authorSecondName: string | null
  authorLastName: string
  authorSecondLastName: string | null
  contentTypeName: string
}

const postSelection = {
  id: posts.id,
  authorId: posts.authorId,
  contentTypeId: posts.contentTypeId,
  title: posts.title,
  description: posts.description,
  status: posts.status,
  publishedAt: posts.publishedAt,
  createdAt: posts.createdAt,
  updatedAt: posts.updatedAt,
  authorFirstName: users.firstName,
  authorSecondName: users.secondName,
  authorLastName: users.lastName,
  authorSecondLastName: users.secondLastName,
  contentTypeName: contentTypes.name
}

const toPostView = (post: PostRow) => ({
  id: post.id,
  authorId: post.authorId,
  authorName: [
    post.authorFirstName,
    post.authorSecondName,
    post.authorLastName,
    post.authorSecondLastName
  ].filter(Boolean).join(' '),
  contentTypeId: post.contentTypeId,
  contentTypeName: post.contentTypeName,
  title: post.title,
  content: post.description,
  status: post.status,
  publishedAt: post.publishedAt,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt
})

export const listPublished = async (page: number, limit: number) => {
  const offset = (page - 1) * limit

  const data = await db
    .select(postSelection)
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .innerJoin(contentTypes, eq(posts.contentTypeId, contentTypes.id))
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset)

  return {
    data: data.map((post) => toPostView(post as PostRow)),
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
    .select(postSelection)
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .innerJoin(contentTypes, eq(posts.contentTypeId, contentTypes.id))
    .where(eq(posts.id, postId))
    .limit(1)

  return post ? toPostView(post as PostRow) : undefined
}

export const create = async (
  input: CreatePostInput,
  authorId: string
) => {
  const status = input.status ?? 'draft'

  const [post] = await db
    .insert(posts)
    .values({
      ...input,
      authorId,
      description: input.description ?? null,
      status,
      publishedAt: status === 'published' ? new Date() : null
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
