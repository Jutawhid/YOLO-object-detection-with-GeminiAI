import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { loginSchema } from './validations/auth';
import { authApi } from './api/auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validate credentials with Zod
          const validatedCredentials = loginSchema.parse(credentials);

          // Call your login API
          const response = await authApi.login(validatedCredentials);
          console.log("🚀 ~ response:", response)

          if (response.token) {
            // Get user info from token or API
            // const user = await authApi.getCurrentUser(response.token);
            
            return {
              id: response.id,
              email: response.email,
              name: response.name,
              token: response.token,
            };
          }

          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add token to JWT
      if (user) {
        token.accessToken = (user as any).token;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("🚀 ~ session:", session)
      session.user = session.user || {};
      // Add token to session
      session.accessToken = token.accessToken as string;
      session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};