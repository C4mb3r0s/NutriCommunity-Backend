import type { NextFunction, Request, Response } from 'express'

export const parseCookies = (
  request: Request,
  _response: Response,
  next: NextFunction
): void => {
  request.cookies = {}

  const cookieHeader = request.headers.cookie

  if (!cookieHeader) {
    next()
    return
  }

  for (const item of cookieHeader.split(';')) {
    const separatorIndex = item.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const name = item.slice(0, separatorIndex).trim()
    const value = item.slice(separatorIndex + 1).trim()

    request.cookies[name] = decodeURIComponent(value)
  }

  next()
}
