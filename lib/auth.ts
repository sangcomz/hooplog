import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import GoogleProvider from "next-auth/providers/google"
import { db, accounts, sessions, users, verificationTokens } from "./db"
import { eq } from "drizzle-orm"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string

        // Fetch latest user data from database to ensure name is up-to-date
        const [userData] = await db
          .select({ name: users.name, email: users.email, image: users.image })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1)

        if (userData) {
          session.user.name = userData.name
          session.user.email = userData.email
          session.user.image = userData.image
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  trustHost: true,
})

