import {
  adminuserParamsSchema,
  paginationSchema,
  updateUserStatusSchema
} from '../../../src/schemas/admin.schema.js'

describe('admin schemas', () => {
  it('validates a user UUID', () => {
    expect(adminuserParamsSchema.safeParse({
      userId: '550e8400-e29b-41d4-a716-446655440000'
    }).success).toBe(true)
  })

  it('rejects an invalid user UUID', () => {
    expect(adminuserParamsSchema.safeParse({ userId: 'invalid' }).success)
      .toBe(false)
  })

  it('coerces and defaults pagination', () => {
    expect(paginationSchema.parse({ page: '2', limit: '10' })).toEqual({
      page: 2,
      limit: 10
    })
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 20 })
  })

  it('rejects pagination outside its limits', () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false)
    expect(paginationSchema.safeParse({ limit: 51 }).success).toBe(false)
  })

  it('accepts only supported user statuses', () => {
    expect(updateUserStatusSchema.safeParse({ status: 'suspended' }).success)
      .toBe(true)
    expect(updateUserStatusSchema.safeParse({ status: 'unknown' }).success)
      .toBe(false)
  })
})
