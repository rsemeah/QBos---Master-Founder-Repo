"use strict";
/**
 * NextAuth Configuration for Rob
 *
 * Provides GitHub OAuth for repository creation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOptions = void 0;
const github_1 = __importDefault(require("next-auth/providers/github"));
exports.authOptions = {
    providers: [
        (0, github_1.default)({
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
//# sourceMappingURL=auth.js.map