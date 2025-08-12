import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { getUserByEmail, updateLastLogin } from '@/lib/mysql/users';
import type { UserRole } from '@/lib/types/auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await getUserByEmail(credentials.email);
          
          if (!user || !user.isActive) {
            return null;
          }

          const isPasswordValid = await compare(credentials.password, user.hashedPassword);
          
          if (!isPasswordValid) {
            return null;
          }

          // Actualizar último login
          await updateLastLogin(user.id);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            serviceId: user.serviceId,
            employeeId: user.employeeId,
            permissions: user.permissions,
            mustChangePassword: user.mustChangePassword
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.serviceId = user.serviceId;
        token.employeeId = user.employeeId;
        token.permissions = user.permissions;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.serviceId = token.serviceId as number;
        session.user.employeeId = token.employeeId as number;
        session.user.permissions = token.permissions as string[];
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Redirigir después del login
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas (turno hospitalario)
  },
  
  secret: process.env.NEXTAUTH_SECRET
};