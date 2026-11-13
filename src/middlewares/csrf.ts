import type { NextFunction, Request, Response } from 'express'
import { verifyCsrfToken } from '../services/token.service.js'

export const requireCsrf = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  const cookieToken = request.cookies?.csrf_token as string | undefined
  const headerToken = request.header('X-CSRF-Token')

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    response.status(403).json({ message: 'Invalid CSRF token' })
    return
  }

  try {
    verifyCsrfToken(headerToken)
    next()
  } catch {
    response.status(403).json({ message: 'Invalid CSRF token' })
  }
}
