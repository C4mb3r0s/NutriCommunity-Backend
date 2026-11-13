import { request, type Request, type Response } from 'express'
import {
  commentIdSchema,
  commentParamsSchema,
  createCommentSchema
} from '../schemas/comment.schema.js'
import * as commentService from '../services/comment.service.js'

export const list = async (
  request: Request,
  response: Response
): Promise<void> => {
  const { postId } = commentParamsSchema.parse(request.params)
  response.json({ data: await commentService.listByPost(postId) })
}

export const create = async (
  request: Request,
  response: Response
): Promise<void> => {
  const { postId } = commentParamsSchema.parse(request.params)
  const { body } = createCommentSchema.parse(request.body)

  if (!request.user) {
    response.status(401).json({ message: 'Authentication required' })
    return
  }

  const comment = await commentService.create(postId, request.user.id, body)

  if (!comment) {
    response.status(401).json({ message: 'Published post not found' })
    return
  }

  response.status(201).json(comment)
}

export const remove = async (
  request: Request,
  response: Response
): Promise<void> => {
  const { commentId } = commentIdSchema.parse(request.params)
  const comment = await commentService.softDelete(commentId)

  if (!comment) {
    response.status(404).json({ message: 'Comment not found' })
  }

  response.status(204).send()

}
