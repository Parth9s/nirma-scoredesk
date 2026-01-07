import NextAuth, { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"

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
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                // Allow Admin Email
                if (profile?.email === "parthsavaliya1111@gmail.com") return true;

                // Allow Nirma Domain for students
                if (profile?.email?.endsWith("@nirmauni.ac.in")) {
                    try {
                        // Check if user exists and is banned BEFORE upserting/updating
                        const existingUser = await prisma.user.findUnique({ where: { email: profile.email as string } });
                        if (existingUser && existingUser.isBanned) {
                            console.log(`Banned user attempted login: ${profile.email}`);
                            return false; // Deny login
                        }

                        // Ensure user exists in DB
                        // We use upsert to create if not exists, or update name/image if changed
                        await prisma.user.upsert({
                            where: { email: profile.email as string },
                            update: {
                                name: profile.name,
                            },
                            create: {
                                email: profile.email as string,
                                name: profile.name,
                                password: "", // No password for Google users
                                role: "STUDENT",
                                hasGlobalAccess: false,
                                lastActive: new Date()
                            }
                        });

                        // Log Login Activity
                        const user = await prisma.user.findUnique({ where: { email: profile.email as string } });
                        if (user) {
                            await prisma.activityLog.create({
                                data: {
                                    userId: user.id,
                                    action: 'LOGIN',
                                    metadata: JSON.stringify({ provider: 'google', ip: 'unknown' }) // NextAuth doesn't give IP easily here
                                }
                            });
                        }
                        return true;
                    } catch (error) {
                        console.error("Error creating user in DB:", error);
                        // If DB fails, we technically shouldn't allow login if we rely on DB for access,
                        // but if we want to allow basic access even if DB is down (fallback), we could return true.
                        // However, for "hasGlobalAccess" feature, we need DB.
                        // For now, let's allow it but log error.
                        return true;
                    }
                }

                return false;
            }
            return true;
        },
        async jwt({ token, user, profile, trigger, session }) {
            // 1. Credentials Login (User object is present)
            if (user) {
                if (user.email === "parthsavaliya1111@gmail.com") {
                    token.role = "ADMIN";
                    token.hasGlobalAccess = true; // Admin has global access
                }
            }

            // 2. Google Login (Profile object is present on first signin)
            if (profile) {
                if (profile.email === "parthsavaliya1111@gmail.com") {
                    token.role = "ADMIN";
                    token.hasGlobalAccess = true;
                } else if (profile.email?.endsWith("@nirmauni.ac.in")) {
                    token.role = "STUDENT";
                    // Fetch hasGlobalAccess from DB for students
                    try {
                        const dbUser = await prisma.user.findUnique({
                            where: { email: profile.email as string }
                        });
                        token.hasGlobalAccess = dbUser?.hasGlobalAccess || false;
                        // @ts-ignore
                        token.isBanned = dbUser?.isBanned || false;
                    } catch (e) {
                        token.hasGlobalAccess = false;
                        // @ts-ignore
                        token.isBanned = false;
                    }
                }
            }

            // 3. Subsequent calls (token exists) - Refresh from DB if needed?
            // To be efficient, we might rely on the token, but if we change access in Admin panel, 
            // the user needs to re-login or we need to fetch on every jwt call.
            // Let's fetch on every call for safety/immediacy since it's a security feature.
            if (token.email) {
                // Ensure we don't overwrite if it's admin hardcoded
                if (token.email !== "parthsavaliya1111@gmail.com") {
                    try {
                        const dbUser = await prisma.user.findUnique({
                            where: { email: token.email }
                        });
                        if (dbUser) {
                            token.hasGlobalAccess = dbUser.hasGlobalAccess;
                            token.role = dbUser.role; // Sync role too
                            // @ts-ignore
                            token.isBanned = dbUser.isBanned;
                        }
                    } catch (e) {
                        // DB down, keep existing token values
                    }
                }
            }

            return token;
        },
        async session({ session, token }) {
            // Pass role to client session
            if (session.user && token.role) {
                // @ts-ignore
                session.user.role = token.role;
                // @ts-ignore
                session.user.hasGlobalAccess = token.hasGlobalAccess;
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
                // @ts-ignore
                if (auth?.token?.isBanned || auth?.user?.isBanned) return false; // Force logout if banned
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
