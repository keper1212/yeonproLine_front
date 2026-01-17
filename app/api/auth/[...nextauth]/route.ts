import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000/api"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.id_token) {
        try {
          const response = await fetch(`${backendUrl}/auth/google`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: account.id_token }),
          })

          if (response.ok) {
            const data = await response.json()
            token.appAccessToken = data.access_token
          }
        } catch {
          // Ignore backend auth failures; NextAuth session still works.
        }
      }

      return token
    },
    async session({ session, token }) {
      session.appAccessToken = token.appAccessToken as string | undefined
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
