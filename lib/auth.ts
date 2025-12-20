import NextAuth, { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

import Credentials from "next-auth/providers/credentials"

export const config = {
    theme: {
        logo: "https://next-auth.js.org/img/logo/logo-sm.png",
    },
    providers: [
        // Keeping Google for future use, but prioritising Credentials for Admin
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            name: "Admin Access",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                // Hardcoded Admin Credentials
                // In production, fetch this from DB and hash password!
                if (
                    credentials.email === "parthsavaliya1111@gmail.com" &&
                    credentials.password === "parth@123"
                ) {
                    return {
                        id: "admin-1",
                        name: "Parth Savaliya",
                        email: "parthsavaliya1111@gmail.com",
                        role: "admin"
                    }
                }
                return null
            }
        })
    ],
    callbacks: {
        async signIn({ account, profile }) {
            if (account?.provider === "google") {
                // Allow Admin Email
                if (profile?.email === "parthsavaliya1111@gmail.com") return true;
                // Allow Nirma Domain for students
                return profile?.email?.endsWith("@nirmauni.ac.in") ?? false;
            }
            return true;
        },
        async jwt({ token, user, profile }) {
            // 1. Credentials Login (User object is present)
            if (user) {
                if (user.email === "parthsavaliya1111@gmail.com") {
                    token.role = "ADMIN";
                }
            }

            // 2. Google Login (Profile object is present)
            if (profile) {
                if (profile.email === "parthsavaliya1111@gmail.com") {
                    token.role = "ADMIN";
                } else if (profile.email?.endsWith("@nirmauni.ac.in")) {
                    token.role = "STUDENT";
                }
            }
            return token;
        },
        async session({ session, token }) {
            // Pass role to client session
            if (session.user && token.role) {
                // @ts-ignore
                session.user.role = token.role;
            }
            return session;
        },
        authorized({ request, auth }) {
            const { pathname } = request.nextUrl
            const isLoggedIn = !!auth
            // @ts-ignore
            const userRole = auth?.user?.role;

            // 1. Admin Routes: STRICTLY REQUIRE ADMIN ROLE
            if (pathname.startsWith("/admin")) {
                if (pathname === "/admin/login") return true;
                // Must be logged in AND be an Admin
                return isLoggedIn && userRole === "ADMIN";
            }

            // 2. Dashboard Routes: REQUIRE LOGIN (Any Role)
            if (pathname.startsWith("/dashboard")) {
                return isLoggedIn;
            }

            return true
        },
    },
    pages: {
        signIn: '/login', // Redirect here if unauthorized (Student Default)
    }
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
