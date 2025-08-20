import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";
import { UserRole } from "./src/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      serviceId?: number;
      employeeId?: number;
      permissions: string[];
      mustChangePassword?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    serviceId?: number;
    employeeId?: number;
    permissions: string[];
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: UserRole;
    serviceId?: number;
    employeeId?: number;
    permissions: string[];
    mustChangePassword?: boolean;
  }
}
