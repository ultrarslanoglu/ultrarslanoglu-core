import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      role: 'viewer' | 'editor' | 'admin' | 'superadmin';
      avatar?: string;
      connectedPlatforms: Record<string, boolean>;
    } & DefaultSession['user'];
    accessToken: string;
    refreshToken: string;
  }

  interface User extends DefaultUser {
    id: string;
    username: string;
    role: 'viewer' | 'editor' | 'admin' | 'superadmin';
    avatar?: string;
    accessToken: string;
    refreshToken: string;
    connectedPlatforms: Record<string, boolean>;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    username: string;
    role: 'viewer' | 'editor' | 'admin' | 'superadmin';
    avatar?: string;
    accessToken: string;
    refreshToken: string;
    connectedPlatforms: Record<string, boolean>;
  }
}
