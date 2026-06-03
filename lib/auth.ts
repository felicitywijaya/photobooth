import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export type UserRole = "admin" | "user"

declare module "next-auth" {
  interface User {
    role: UserRole
  }
  interface Session {
    user: {
      role: UserRole
    } & DefaultSession["user"]
  }
}


export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const username = credentials?.username as string
        const password = credentials?.password as string

        if (
          username === process.env.ADMIN_USERNAME &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "admin", name: "Admin", role: "admin" as UserRole }
        }

        if (
          username === process.env.USER_USERNAME &&
          password === process.env.USER_PASSWORD
        ) {
          return { id: "user", name: "User", role: "user" as UserRole }
        }

        return null
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) (token as Record<string, unknown>).role = (user as { role: UserRole }).role
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = (token as Record<string, unknown>).role as UserRole
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})
