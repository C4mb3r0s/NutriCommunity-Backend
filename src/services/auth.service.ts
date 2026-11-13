import bcrypt from 'bcrypt'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db/index.js'
import {
  refreshSessions,
  roles,
  userRoles,
  users
} from '../db/schema/index.js'
import type {
  LoginInput,
  RegisterInput
} from '../schemas/auth.schema.js'
import {
  createAccessToken,
  createCsrfToken,
  createRefreshToken,
  createSessionId,
  getTokenExpiration,
  hashToken,
  verifyRefreshToken
} from './token.service.js'

const passwordRounds = 14

const getRolesByUserId = async (
  userId: string
): Promise<string[]> => {
  const rows = await db
    .select({ code: roles.code })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId))

  return rows.map((row) => row.code)
}

const createSession = async (
  userId: string,
  rolesList: string[],
  ipAddress: string | undefined
) => {
  const sessionId = createSessionId()
  const refreshToken = createRefreshToken(userId, sessionId)
  const csrfToken = createCsrfToken(userId, sessionId)

  await db.insert(refreshSessions).values({
    userId,
    tokenJti: sessionId,
    tokenHash: hashToken(refreshToken),
    expiresAt: getTokenExpiration(refreshToken),
    ipAddress
  })

  return {
    accessToken: createAccessToken(userId, rolesList),
    refreshToken,
    csrfToken,
    sessionId
  }
}

export const register = async (input: RegisterInput) => {
  const email = input.email.toLowerCase()
  const passwordHash = await bcrypt.hash(input.password, passwordRounds)

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existingUser.length > 0) {
    throw new Error('EMAIL_ALREADY_EXISTS')
  }

  return db.transaction(async (transaction) => {
    const [user] = await transaction
      .insert(users)
      .values({
        firstName: input.firstName,
        secondName: input.secondName || null,
        lastName: input.lastName,
        secondLastName: input.secondLastName || null,
        email,
        passwordHash
      })
      .returning({
        id: users.id,
        firstName: users.firstName,
        secondName: users.secondName,
        lastName: users.lastName,
        secondLastName: users.secondLastName,
        email: users.email
      })

    if (!user) {
      throw new Error('USER_CREATION_FAILED')
    }

    const [participantRole] = await transaction
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.code, 'participant'))
      .limit(1)

    if (!participantRole) {
      throw new Error('PARTICIPANT_ROLE_NOT_FOUND')
    }

    await transaction.insert(userRoles).values({
      userId: user.id,
      roleId: participantRole.id
    })

    return {
      ...user,
      roles: ['participant']
    }
  })
}

export const login = async (
  input: LoginInput,
  ipAddress: string | undefined
) => {
  const email = input.email.toLowerCase()
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user || user.status !== 'active') {
    throw new Error('INVALID_CREDENTIALS')
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash
  )

  if (!passwordMatches) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const userRolesList = await getRolesByUserId(user.id)
  const session = await createSession(user.id, userRolesList, ipAddress)

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      secondName: user.secondName,
      lastName: user.lastName,
      secondLastName: user.secondLastName,
      email: user.email,
      roles: userRolesList
    },
    ...session
  }
}

export const getAuthenticatedUser = async (userId: string) => {
  const [user] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      secondName: users.secondName,
      lastName: users.lastName,
      secondLastName: users.secondLastName,
      email: users.email,
      status: users.status
    })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.status, 'active')))
    .limit(1)

  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  return {
    ...user,
    roles: await getRolesByUserId(user.id)
  }
}

export const refresh = async (
  refreshToken: string,
  ipAddress: string | undefined
) => {
  const payload = verifyRefreshToken(refreshToken)
  const [session] = await db
    .select()
    .from(refreshSessions)
    .where(
      and(
        eq(refreshSessions.tokenJti, payload.jti),
        isNull(refreshSessions.revokedAt)
      )
    )
    .limit(1)

  if (!session || session.tokenHash !== hashToken(refreshToken)) {
    throw new Error('REFRESH_TOKEN_INVALID')
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    throw new Error('REFRESH_TOKEN_EXPIRED')
  }

  const userRolesList = await getRolesByUserId(session.userId)
  const nextSession = await createSession(
    session.userId,
    userRolesList,
    ipAddress
  )

  await db
    .update(refreshSessions)
    .set({
      revokedAt: new Date(),
      replacedBy: nextSession.sessionId,
      lastUsedAt: new Date()
    })
    .where(eq(refreshSessions.id, session.id))

  return nextSession
}

export const logout = async (refreshToken: string): Promise<void> => {
  const payload = verifyRefreshToken(refreshToken)

  await db
    .update(refreshSessions)
    .set({
      revokedAt: new Date(),
      lastUsedAt: new Date()
    })
    .where(eq(refreshSessions.tokenJti, payload.jti))
}
