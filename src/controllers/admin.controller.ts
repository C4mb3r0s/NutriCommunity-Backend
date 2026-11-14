import type { Request, Response } from 'express'
import {
  adminuserParamsSchema,
  paginationSchema,
  updateUserStatusSchema
} from '../schemas/admin.schema.js'
import * as adminService from '../services/admin.service.js'

export const listUsers = async (
  request: Request,
  response: Response
): Promise<void> => {
  const { page, limit } = paginationSchema.parse(request.query)
  response.json(await adminService.listUsers(page, limit))
}

export const updateUserStatus = async (
  request: Request,
  response: Response
): Promise<void> => {
  const { userId } = adminuserParamsSchema.parse(request.params)
  const { status } = updateUserStatusSchema.parse(request.body)

  if (request.user?.id === userId) {
    response.status(400).json({ message: 'You cannot suspend yourself' })
    return
  }

  let user

  try {
    user = await adminService.updateUserStatus(userId, status)
  } catch (error) {
    if (error instanceof Error && error.message === 'ADMIN_USER_PROTECTED') {
      response.status(403).json({ message: 'Administrator users cannot be modified' })
      return
    }

    throw error
  }

  if (!user) {
    response.status(404).json({ message: 'User not found' })
    return
  }

  response.json(user)
}
