import { z } from 'zod'

export const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  secondName: z.string().trim().max(80).nullish(),
  lastName: z.string().trim().min(2).max(80),
  secondLastName: z.string().trim().max(80).nullish(),
  email: z.email().trim().max(255),
  password: z.string().min(8).max(128)
})

export const loginSchema = z.object({
  email: z.email().trim().max(255),
  password: z.string().min(8).max(128)
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
