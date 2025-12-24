/**
 * NextAuth Configuration for Rob
 * 
 * Provides GitHub OAuth for repository creation
 */

import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'repo user:email',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist GitHub access token
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      // @ts-ignore - Add access token to session
      session.accessToken = token.accessToken;
      // @ts-ignore
      session.provider = token.provider;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
