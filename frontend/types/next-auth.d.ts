import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      credits: number;
      plan: string;
      role: string;
      requires2FA?: boolean;
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    credits: number;
    plan: string;
    role?: string;
    requires2FA?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    credits: number;
    plan: string;
    role?: string;
    requires2FA?: boolean;
  }
}
