import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("🔐 Login attempt with email:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        try {
          // Connect to MongoDB
          await connectDB();
          
          // Find user by email in MongoDB
          const user = await User.findOne({ email: credentials.email.toLowerCase() });
          
          console.log("👤 User found:", user ? "Yes" : "No");
          
          if (!user) {
            console.log("❌ User not found in database");
            return null;
          }

          // Check password
          const isPasswordValid = await compare(credentials.password, user.password);
          
          console.log("🔑 Password valid:", isPasswordValid);
          
          if (!isPasswordValid) {
            console.log("❌ Invalid password");
            return null;
          }

          console.log("✅ Login successful for:", user.email);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            credits: user.credits,
            plan: user.plan,
          };
        } catch (error) {
          console.error("❌ Auth error:", error);
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
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.credits = user.credits;
        token.plan = user.plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.credits = token.credits as number;
        session.user.plan = token.plan as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
