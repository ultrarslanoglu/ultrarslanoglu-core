import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'example@ultrarslanoglu.com' },
        password: { label: 'Şifre', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email ve şifre gereklidir');
        }

        try {
          // Backend API'ye login isteği
          const response = await axios.post(`${API_URL}/api/user/login`, {
            email: credentials.email,
            password: credentials.password
          });

          if (response.data.success && response.data.data.user) {
            const { user, accessToken, refreshToken } = response.data.data;
            
            return {
              id: user.id,
              email: user.email,
              name: user.fullName || user.username,
              username: user.username,
              role: user.role,
              avatar: user.avatar,
              accessToken,
              refreshToken,
              connectedPlatforms: user.connectedPlatforms
            };
          }

          throw new Error('Giriş başarısız');
        } catch (error: any) {
          console.error('Login error:', error.response?.data || error.message);
          throw new Error(error.response?.data?.error || 'Giriş başarısız oldu');
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // İlk giriş
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.username = user.username;
        token.role = user.role;
        token.avatar = user.avatar;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.connectedPlatforms = user.connectedPlatforms;
      }

      // Access token hala geçerli mi kontrol et
      // TODO: Token expiry kontrolü eklenebilir

      return token;
    },

    async session({ session, token }) {
      if (token) {
        const role = (token.role as 'viewer' | 'editor' | 'admin' | 'superadmin' | undefined) ?? 'viewer';
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          username: token.username as string,
          role,
          avatar: token.avatar as string,
          connectedPlatforms: token.connectedPlatforms as Record<string, boolean>
        };
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
      }

      return session;
    }
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    newUser: '/auth/register'
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
