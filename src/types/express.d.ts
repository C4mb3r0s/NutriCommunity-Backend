export { }

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        roles: string[]
      }
      cookies: Record<string, string | undefined>
    }
  }
}
