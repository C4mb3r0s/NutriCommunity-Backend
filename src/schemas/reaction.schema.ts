import { uuid, z } from 'zod'

export const reactionParamsSchema = z.object({
  postId: uuid()
})

export const reactionSchema = z.object({
  type: z.enum(['like', 'love', 'amaze'])
})
