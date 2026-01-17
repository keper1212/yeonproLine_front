import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      const tokenWithId = token as typeof token & { idToken?: string }
      if (account?.id_token) {
        tokenWithId.idToken = account.id_token
      }
      return tokenWithId
    },
    async session({ session, token }) {
      const sessionWithId = session as typeof session & { idToken?: string }
      sessionWithId.idToken = (token as typeof token & { idToken?: string })
        .idToken
      return sessionWithId
    },
  },
})

export { handler as GET, handler as POST }
