import type { NextFunction, Request, Response } from 'express'
import { jest } from '@jest/globals'
import { parseCookies } from '../../../src/middlewares/cookies.js'

describe('parseCookies middleware', () => {
  it('parses multiple cookies and decodes values', () => {
    const request = {
      headers: { cookie: 'session=abc; csrf_token=hello%20world' }
    } as Request
    const next = jest.fn() as NextFunction

    parseCookies(request, {} as Response, next)

    expect(request.cookies).toEqual({
      session: 'abc',
      csrf_token: 'hello world'
    })
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('initializes empty cookies when there is no cookie header', () => {
    const request = { headers: {} } as Request
    const next = jest.fn() as NextFunction

    parseCookies(request, {} as Response, next)

    expect(request.cookies).toEqual({})
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('ignores cookie items without a separator', () => {
    const request = {
      headers: { cookie: 'invalid; valid=value' }
    } as Request
    const next = jest.fn() as NextFunction

    parseCookies(request, {} as Response, next)

    expect(request.cookies).toEqual({ valid: 'value' })
  })
})
