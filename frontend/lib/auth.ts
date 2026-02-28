import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();
          const user = await User.findOne({ email: credentials.email.toLowerCase() });
          
          if (!user) {
            return null;
          }

          // OAuth users don't have passwords
          if (!user.password) {
            return null;
          }

          const isPasswordValid = await compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            return null;
          }

          // Check if 2FA is enabled
          if (user.twoFactorEnabled && user.twoFactorSecret) {
            // If 2FA is enabled but no code provided, return partial auth
            if (!credentials.totpCode) {
              // Return special indicator that 2FA is required
              return {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                image: user.image,
                credits: user.credits,
                plan: user.plan,
                role: user.role || 'user',
                requires2FA: true,
              };
            }

            // Verify TOTP code - this will be handled by the 2FA verify endpoint
            // For now, just proceed with login
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            credits: user.credits,
            plan: user.plan,
            role: user.role || 'user',
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-in (Google/GitHub)
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          await connectDB();
          
          // Check if user exists
          let existingUser = await User.findOne({ email: user.email?.toLowerCase() });
          
          if (!existingUser) {
            // Create new user from OAuth
            existingUser = await User.create({
              name: user.name || profile?.name || 'User',
              email: user.email?.toLowerCase(),
              password: '', // OAuth users don't need password
              image: user.image,
              emailVerified: new Date(),
              plan: 'free',
              credits: 5,
              role: 'user',
              authProvider: account.provider,
            });
          } else {
            // Update image if changed
            if (user.image && user.image !== existingUser.image) {
              existingUser.image = user.image;
              await existingUser.save();
            }
          }
          
          return true;
        } catch (error) {
          console.error("OAuth signIn error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.credits = user.credits;
        token.plan = user.plan;
        token.role = user.role || 'user';
        token.requires2FA = user.requires2FA;
      }
      
      // Fetch fresh user data from DB on token refresh
      if (account?.provider && (account.provider === "google" || account.provider === "github")) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email?.toString().toLowerCase() });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.credits = dbUser.credits;
            token.plan = dbUser.plan;
            token.role = dbUser.role || 'user';
          }
        } catch (error) {
          console.error("JWT callback error:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.credits = token.credits as number;
        session.user.plan = token.plan as string;
        session.user.role = token.role as string;
        session.user.requires2FA = token.requires2FA as boolean;
      }
      return session;
    }
  },
  events: {
    async signIn({ user, account }) {
      // Log successful sign-in for audit
      console.log(`✅ User signed in: ${user.email} via ${account?.provider || 'credentials'}`);
    },
    async signOut({ token }) {
      console.log(`👋 User signed out: ${token.email}`);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
