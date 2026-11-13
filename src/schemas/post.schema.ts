import { z } from 'zod'

export const postIdSchema = z.object({
  postId: z.uuid()
})

export const createPostSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(2000).nullish(),
  contentTypeId: z.uuid()
})

export const updatePostSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  description: z.string().trim().max(2000).nullish(),
  contentTypeId: z.uuid().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
)

export const listPostsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
})

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>

