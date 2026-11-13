import type { NextFunction, Request, Response } from 'express'

export const authorize = (...allowedRoles: string[]) => {
  return (
    request: Request,
    response: Response,
    next: NextFunction
  ): void => {
    if (!request.user) {
      response.status(401).json({ message: 'Authentication required' })
      return
    }

    const hasPermission = request.user.roles.some((role) =>
      allowedRoles.includes(role)
    )

    if (!hasPermission) {
      response.status(403).json({ message: 'Insufficient permissions' })
      return
    }

    next()
  }
}
