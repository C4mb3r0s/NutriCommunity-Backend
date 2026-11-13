import type { Request, Response } from 'express'
import {
  createPostSchema,
  listPostsSchema,
  postIdSchema,
  updatePostSchema
} from '../schemas/post.schema.js'
import * as postService from '../services/post.service.js'

export const list = async (
  request: Request,
  response: Response
): Promise<void> => {
  const query = listPostsSchema.parse(request.query)
  response.json(await postService.listPublished(query.page, query.limit))
}

export const detail = async (
  request: Request,
  response: Response
): Promise<void> => {
  const { postId } = postIdSchema.parse(request.params)
  const post = await postService.findById(postId)

  if (!post || post.status === 'deleted') {
    response.status(404).json({ message: 'Post not found' })
    return
  }

  response.json(post)
}

export const create = async (
  request: Request,
  response: Response
): Promise<void> => {
  if (!request.user) {
    response.status(401).json({ message: 'Authentication required' })
    return
  }

  const input = createPostSchema.parse(request.body)
  const post = await postService.create(input, request.user.id)
  response.status(201).json(post)
}

export const update = async (
  request: Request,
  response: Response
): Promise<void> => {
  const { postId } = postIdSchema.parse(request.params)
  const input = updatePostSchema.parse(request.body)
  const post = await postService.update(postId, input)

  if (!post) {
    response.status(404).json({ message: 'Post not found' })
    return
  }

  response.json(post)
}

export const remove = async (
  request: Request,
  response: Response
): Promise<void> => {
  const { postId } = postIdSchema.parse(request.params)
  const post = await postService.softDelete(postId)

  if (!post) {
    response.status(404).json({ message: 'Post not found' })
    return
  }

  response.status(204).send()
}
