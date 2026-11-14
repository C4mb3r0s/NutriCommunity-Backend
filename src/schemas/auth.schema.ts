import { z } from 'zod'

export const passwordSchema = z.string()
  .min(10, 'The password must contain at least 10 characters')
  .max(128, 'The password cannot exceed 128 characters')
  .regex(/[A-Z]/, 'The password must contain an uppercase letter')
  .regex(/[a-z]/, 'The password must contain a lowercase letter')
  .regex(/[0-9]/, 'The password must contain a number')
  .regex(/[^A-Za-z0-9\s]/, 'The password must contain a special character')

export const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  secondName: z.string().trim().max(80).nullish(),
  lastName: z.string().trim().min(2).max(80),
  secondLastName: z.string().trim().max(80).nullish(),
  email: z.email().trim().max(255),
  password: passwordSchema
})

export const loginSchema = z.object({
  email: z.email().trim().max(255),
  password: z.string().min(1).max(128)
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
