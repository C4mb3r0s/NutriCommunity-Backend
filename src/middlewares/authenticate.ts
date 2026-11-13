import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../services/token.service.js'

export const authenticate = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  const authorization = request.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Authentication required' })
    return
  }

  try {
    const payload = verifyAccessToken(
      authorization.slice('Bearer '.length)
    )

    request.user = {
      id: payload.sub,
      roles: payload.roles
    }

    next()
  } catch {
    response.status(401).json({
      message: 'Invalid or expired access token'
    })
  }
}
