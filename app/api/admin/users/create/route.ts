import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await auth();
        // @ts-ignore
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { email, name } = body;

        if (!email || !email.endsWith('@nirmauni.ac.in')) {
            return NextResponse.json({ error: 'Invalid email. Must be a University email.' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const newUser = await prisma.user.create({
            data: {
                email,
                name: name || email.split('@')[0],
                password: "", // No password for initial create
                role: 'STUDENT'
            }
        });

        return NextResponse.json(newUser);
    } catch (error) {
        console.error("Create User Error:", error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
