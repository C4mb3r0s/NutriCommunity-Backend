import jwt from 'jsonwebtoken'

process.env.JWT_SECRET = 'test-jwt-secret'
process.env.REFRESH_TOKEN_HMAC_SECRET = 'test-refresh-secret'
process.env.CSRF_SECRET = 'test-csrf-secret'
process.env.JWT_EXPIRES_IN = '15m'
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d'

const tokenService = await import('../../../src/services/token.service.js')

describe('token service', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000'
  const sessionId = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'

  it('creates and verifies an access token', () => {
    const token = tokenService.createAccessToken(userId, ['participant'])
    const payload = tokenService.verifyAccessToken(token)

    expect(payload.sub).toBe(userId)
    expect(payload.type).toBe('access')
    expect(payload.roles).toEqual(['participant'])
  })

  it('creates and verifies a refresh token', () => {
    const token = tokenService.createRefreshToken(userId, sessionId)
    const payload = tokenService.verifyRefreshToken(token)

    expect(payload.sub).toBe(userId)
    expect(payload.jti).toBe(sessionId)
    expect(payload.type).toBe('refresh')
  })

  it('creates and verifies a CSRF token', () => {
    const token = tokenService.createCsrfToken(userId, sessionId)
    const payload = tokenService.verifyCsrfToken(token)

    expect(payload.sub).toBe(userId)
    expect(payload.sid).toBe(sessionId)
    expect(payload.type).toBe('csrf')
  })

  it('rejects tokens signed with another secret', () => {
    const token = jwt.sign(
      { sub: userId, type: 'access', roles: [] },
      'wrong-secret'
    )

    expect(() => tokenService.verifyAccessToken(token)).toThrow()
  })

  it('rejects tokens with an invalid type or payload', () => {
    const wrongType = jwt.sign(
      { sub: userId, type: 'refresh', roles: [] },
      process.env.JWT_SECRET as string
    )
    const missingRoles = jwt.sign(
      { sub: userId, type: 'access' },
      process.env.JWT_SECRET as string
    )

    expect(() => tokenService.verifyAccessToken(wrongType)).toThrow()
    expect(() => tokenService.verifyAccessToken(missingRoles)).toThrow()
  })

  it('rejects invalid refresh and CSRF payloads', () => {
    const invalidRefresh = jwt.sign(
      { sub: userId, type: 'refresh' },
      process.env.REFRESH_TOKEN_HMAC_SECRET as string
    )
    const invalidCsrf = jwt.sign(
      { sub: userId, type: 'csrf' },
      process.env.CSRF_SECRET as string
    )

    expect(() => tokenService.verifyRefreshToken(invalidRefresh)).toThrow()
    expect(() => tokenService.verifyCsrfToken(invalidCsrf)).toThrow()
  })

  it('rejects expired tokens', () => {
    const token = jwt.sign(
      { sub: userId, type: 'access', roles: [] },
      process.env.JWT_SECRET as string,
      { expiresIn: -1 }
    )

    expect(() => tokenService.verifyAccessToken(token)).toThrow()
  })

  it('hashes tokens and reads their expiration', () => {
    const token = tokenService.createRefreshToken(userId, sessionId)
    const hash = tokenService.hashToken(token)
    const expiration = tokenService.getTokenExpiration(token)

    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(expiration.getTime()).toBeGreaterThan(Date.now())
  })

  it('rejects tokens without an expiration', () => {
    const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET as string)

    expect(() => tokenService.getTokenExpiration(token)).toThrow(
      'Token expiration is missing'
    )
  })
})
