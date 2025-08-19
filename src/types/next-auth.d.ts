import NextAuth from "next-auth"
import { UserRole } from "@/lib/types/auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      serviceId?: number
      employeeId?: number
      permissions: string[]
      mustChangePassword?: boolean
    }
  }

  interface User {
    id: string
    email: string
    name: string
    username?: string;
    hashedPassword?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    role: UserRole
    serviceId?: number
    employeeId?: number
    permissions: string[]
    mustChangePassword?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    serviceId?: number
    employeeId?: number
    permissions: string[]
    mustChangePassword?: boolean
  }
}