import {
  reactionParamsSchema,
  reactionSchema
} from '../../../src/schemas/reaction.schema.js'

describe('reaction schemas', () => {
  it('accepts supported reaction types', () => {
    expect(reactionSchema.safeParse({ type: 'like' }).success).toBe(true)
    expect(reactionSchema.safeParse({ type: 'love' }).success).toBe(true)
    expect(reactionSchema.safeParse({ type: 'amaze' }).success).toBe(true)
  })

  it('rejects unsupported reactions and IDs', () => {
    expect(reactionSchema.safeParse({ type: 'angry' }).success).toBe(false)
    expect(reactionParamsSchema.safeParse({ postId: 'invalid' }).success)
      .toBe(false)
  })
})
