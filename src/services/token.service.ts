import { createHash, randomUUID } from 'node:crypto'
import jwt, {
  type JwtPayload,
  type SignOptions
} from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET
const refreshSecret = process.env.REFRESH_TOKEN_HMAC_SECRET
const csrfSecret = process.env.CSRF_SECRET

if (!jwtSecret || !refreshSecret || !csrfSecret) {
  throw new Error('Authentication secrets are not configured')
}

const accessExpiresIn = process.env.JWT_EXPIRES_IN ?? '15m'
const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d'

export interface AccessTokenPayload extends JwtPayload {
  sub: string
  type: 'access'
  roles: string[]
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string
  jti: string
  type: 'refresh'
}

export interface CsrfTokenPayload extends JwtPayload {
  sub: string
  sid: string
  type: 'csrf'
}

const signOptions = (expiresIn: string): SignOptions => ({
  algorithm: 'HS256',
  expiresIn: expiresIn as SignOptions['expiresIn']
})

export const createAccessToken = (
  userId: string,
  roles: string[]
): string => jwt.sign(
  {
    sub: userId,
    type: 'access',
    roles
  },
  jwtSecret,
  signOptions(accessExpiresIn)
)

export const createRefreshToken = (
  userId: string,
  sessionId: string
): string => jwt.sign(
  {
    sub: userId,
    jti: sessionId,
    type: 'refresh'
  },
  refreshSecret,
  signOptions(refreshExpiresIn)
)

export const createCsrfToken = (
  userId: string,
  sessionId: string
): string => jwt.sign(
  {
    sub: userId,
    sid: sessionId,
    type: 'csrf'
  },
  csrfSecret,
  signOptions(refreshExpiresIn)
)

export const verifyAccessToken = (
  token: string
): AccessTokenPayload => {
  const payload = jwt.verify(token, jwtSecret, {
    algorithms: ['HS256']
  })

  if (
    typeof payload === 'string' ||
    payload.type !== 'access' ||
    typeof payload.sub !== 'string' ||
    !Array.isArray(payload.roles) ||
    !payload.roles.every((role) => typeof role === 'string')
  ) {
    throw new Error('Invalid access token')
  }

  return payload as AccessTokenPayload
}

export const verifyRefreshToken = (
  token: string
): RefreshTokenPayload => {
  const payload = jwt.verify(token, refreshSecret, {
    algorithms: ['HS256']
  })

  if (
    typeof payload === 'string' ||
    payload.type !== 'refresh' ||
    typeof payload.sub !== 'string' ||
    typeof payload.jti !== 'string'
  ) {
    throw new Error('Invalid refresh token')
  }

  return payload as RefreshTokenPayload
}

export const verifyCsrfToken = (
  token: string
): CsrfTokenPayload => {
  const payload = jwt.verify(token, csrfSecret, {
    algorithms: ['HS256']
  })

  if (
    typeof payload === 'string' ||
    payload.type !== 'csrf' ||
    typeof payload.sub !== 'string' ||
    typeof payload.sid !== 'string'
  ) {
    throw new Error('Invalid CSRF token')
  }

  return payload as CsrfTokenPayload
}

export const hashToken = (token: string): string => createHash('sha256')
  .update(token)
  .digest('hex')

export const getTokenExpiration = (token: string): Date => {
  const payload = jwt.decode(token)

  if (!payload || typeof payload === 'string' || !payload.exp) {
    throw new Error('Token expiration is missing')
  }

  return new Date(payload.exp * 1000)
}

export const createSessionId = (): string => randomUUID()
