import {
  loginSchema,
  registerSchema
} from '../src/schemas/auth.schema.js'

const baseRegistration = {
  firstName: 'Eduardo',
  lastName: 'Camberos',
  email: 'eduardo@example.com'
}

const invalidPasswords: Array<[string, string]> = [
  ['fewer than 10 characters', 'Nutri1!'],
  ['no uppercase letter', 'nutripass1!'],
  ['no lowercase letter', 'NUTRIPASS1!'],
  ['no number', 'NutriPass!!'],
  ['no special character', 'NutriPass1'],
  ['only a space as special character', 'NutriPass1 ']
]

describe('password validation', () => {
  it('accepts a password with the required complexity', () => {
    const result = registerSchema.safeParse({
      ...baseRegistration,
      password: 'NutriPass1!'
    })

    expect(result.success).toBe(true)
  })

  it.each(invalidPasswords)(
    'rejects a password with %s',
    (_description: string, password: string) => {
      const result = registerSchema.safeParse({
        ...baseRegistration,
        password
      })

      expect(result.success).toBe(false)
    }
  )

  it('allows an existing eight-character password during login', () => {
    const result = loginSchema.safeParse({
      email: baseRegistration.email,
      password: 'OldPass1'
    })

    expect(result.success).toBe(true)
  })
})
