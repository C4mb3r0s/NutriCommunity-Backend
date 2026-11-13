import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { loginSchema, registerSchema } from '../schemas/auth.schema.js'
import * as authService from '../services/auth.service.js'

const isProduction = process.env.NODE_ENV === 'production'

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/api/auth'
}

const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/api'
}

const handleError = (error: unknown, response: Response): void => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Invalid request data',
      issues: error.issues
    })
    return
  }

  if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
    response.status(409).json({ message: 'Email already registered' })
    return
  }

  if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
    response.status(401).json({ message: 'Invalid credentials' })
    return
  }

  if (error instanceof Error && error.message.startsWith('REFRESH_TOKEN')) {
    response.status(401).json({ message: 'Invalid refresh session' })
    return
  }

  response.status(500).json({ message: 'Internal server error' })
}

export const register = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const input = registerSchema.parse(request.body)
    const user = await authService.register(input)
    response.status(201).json({ user })
  } catch (error) {
    handleError(error, response)
  }
}

export const login = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const input = loginSchema.parse(request.body)
    const result = await authService.login(input, request.ip)

    response
      .cookie('refresh_token', result.refreshToken, refreshCookieOptions)
      .cookie('csrf_token', result.csrfToken, csrfCookieOptions)
      .status(200)
      .json({
        accessToken: result.accessToken,
        user: result.user
      })
  } catch (error) {
    handleError(error, response)
  }
}

export const me = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    if (!request.user) {
      response.status(401).json({ message: 'Authentication required' })
      return
    }

    const user = await authService.getAuthenticatedUser(request.user.id)
    response.json({ user })
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      response.status(401).json({ message: 'User is not active' })
      return
    }

    handleError(error, response)
  }
}

export const refresh = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const refreshToken = request.cookies?.refresh_token as string | undefined

    if (!refreshToken) {
      response.status(401).json({ message: 'Refresh token required' })
      return
    }

    const result = await authService.refresh(refreshToken, request.ip)

    response
      .cookie('refresh_token', result.refreshToken, refreshCookieOptions)
      .cookie('csrf_token', result.csrfToken, csrfCookieOptions)
      .json({ accessToken: result.accessToken })
  } catch (error) {
    handleError(error, response)
  }
}

export const logout = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const refreshToken = request.cookies?.refresh_token as string | undefined

    if (refreshToken) {
      await authService.logout(refreshToken)
    }

    response
      .clearCookie('refresh_token', refreshCookieOptions)
      .clearCookie('csrf_token', csrfCookieOptions)
      .status(204)
      .send()
  } catch (error) {
    handleError(error, response)
  }
}
