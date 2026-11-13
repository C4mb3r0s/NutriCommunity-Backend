import type { Request, Response } from 'express'
import {
  reactionParamsSchema,
  reactionSchema
} from '../schemas/reaction.schema.js'
import * as reactionService from '../services/reaction.service.js'

export const toggle = async (
  request: Request,
  response: Response
): Promise<void> => {
  const { postId } = reactionParamsSchema.parse(request.params)
  const { type } = reactionSchema.parse(request.body)

  if (!request.user) {
    response.status(401).json({ message: 'Authentication required' })
    return
  }

  const reaction = await reactionService.toggle(
    postId,
    request.user.id,
    type
  )

  if (reaction === null) {
    response.status(200).json({ postId, userId: request.user.id, type: null })
    return
  }

  response.json(reaction)
}
