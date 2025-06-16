import { DrizzleAdapter } from "@auth/drizzle-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export type UserRole = "STUDENT" | "LIBRARIAN";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      numeroDeBac?: string;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role?: UserRole;
    numeroDeBac?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: UserRole;
    numeroDeBac?: string;
  }
}

const customAdapter = {
  ...DrizzleAdapter(db),
  async createUser(user: any) {
    // 1) Build a random numeroDeBac
    const timestamp = Date.now().toString().slice(-8);
    const randomStr = Math.random().toString(36).substr(2, 6);
    const randomNumeroDeBac = `O${timestamp}${randomStr}`;

    // 2) Generate & hash a random password
    const rawPassword = crypto.randomBytes(12).toString("hex");
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // (Optionally email rawPassword to the user here)

    // 3) Insert
    const [newUser] = await db
      .insert(users)
      .values({
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role || "STUDENT",
        numeroDeBac: randomNumeroDeBac,
        password: hashedPassword,
        emailVerified: user.emailVerified,
      })
      .returning();

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      image: newUser.image,
      role: newUser.role,
      numeroDeBac: newUser.numeroDeBac,
      emailVerified: newUser.emailVerified,
      rawPassword, // return if you’ll send it to the user
    };
  },
} as Adapter;

export const authOptions: NextAuthOptions = {
  adapter: customAdapter,
  secret: process.env.NEXTAUTH_SECRET!,
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "STUDENT",
        };
      },
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        numeroDeBac: { label: "Numero de Bac", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.numeroDeBac || !credentials?.password) {
          throw new Error("Numéro de bac et mot de passe requis");
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.numeroDeBac, credentials.numeroDeBac));

        if (!user) {
          throw new Error("Aucun utilisateur trouvé avec ce numéro de bac");
        }

        // **Fix**: also reject the placeholder string
        if (!user.password || user.password === "OAUTH_USER") {
          throw new Error(
            "Ce compte utilise une autre méthode de connexion (Google)"
          );
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) {
          throw new Error("Mot de passe incorrect");
        }

        return {
          id: user.id,
          email: user.email ?? null,
          name: user.name ?? null,
          image: user.image ?? null,
          role: (user.role as UserRole) ?? "STUDENT",
          numeroDeBac: user.numeroDeBac,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        if (!token.role) {
          try {
            const u = await db.query.users.findFirst({
              where: eq(users.id, token.id as string),
            });
            token.role = (u?.role || "STUDENT") as UserRole;
            token.numeroDeBac = u?.numeroDeBac;
          } catch {
            token.role = "STUDENT";
          }
        }
        session.user.role = token.role as UserRole;
        session.user.numeroDeBac = token.numeroDeBac;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
        token.numeroDeBac = user.numeroDeBac;
      }
      if (!token.role && token.id) {
        try {
          const u = await db.query.users.findFirst({
            where: eq(users.id, token.id),
          });
          token.role = (u?.role || "STUDENT") as UserRole;
          token.numeroDeBac = u?.numeroDeBac;
        } catch {
          token.role = "STUDENT";
        }
      }
      return token;
    },
    async signIn() {
      return true;
    },
  },
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);
