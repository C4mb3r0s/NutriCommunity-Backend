import type { NextFunction, Request, Response } from 'express'
import { jest } from '@jest/globals'

process.env.JWT_SECRET = 'test-jwt-secret'
process.env.REFRESH_TOKEN_HMAC_SECRET = 'test-refresh-secret'
process.env.CSRF_SECRET = 'test-csrf-secret'

const { createCsrfToken } = await import(
  '../../../src/services/token.service.js'
)
const { requireCsrf } = await import('../../../src/middlewares/csrf.js')

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
})

describe('CSRF middleware', () => {
  it('rejects a missing cookie or header', () => {
    const response = createResponse()
    const next = jest.fn() as NextFunction
    const request = {
      cookies: {},
      header: jest.fn().mockReturnValue(undefined)
    } as unknown as Request

    requireCsrf(request, response as Response, next)

    expect(response.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects different cookie and header values', () => {
    const response = createResponse()
    const next = jest.fn() as NextFunction
    const request = {
      cookies: { csrf_token: 'cookie-token' },
      header: jest.fn().mockReturnValue('header-token')
    } as unknown as Request

    requireCsrf(request, response as Response, next)

    expect(response.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('continues with a valid matching token', () => {
    const response = createResponse()
    const next = jest.fn() as NextFunction
    const token = createCsrfToken(
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-41d1-80b4-00c04fd430c8'
    )
    const request = {
      cookies: { csrf_token: token },
      header: jest.fn().mockReturnValue(token)
    } as unknown as Request

    requireCsrf(request, response as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('rejects a token with an invalid signature', () => {
    const response = createResponse()
    const next = jest.fn() as NextFunction
    const request = {
      cookies: { csrf_token: 'invalid-token' },
      header: jest.fn().mockReturnValue('invalid-token')
    } as unknown as Request

    requireCsrf(request, response as Response, next)

    expect(response.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})
