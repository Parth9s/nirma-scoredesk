import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await auth();
        // @ts-ignore
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        const [users, total] = await prisma.$transaction([
            prisma.user.findMany({
                where: query ? {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                    ]
                } : undefined,
                orderBy: { createdAt: 'desc' },
                take: 100, // Increased limit for now
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    hasGlobalAccess: true,
                    isBanned: true,
                    createdAt: true
                }
            }),
            prisma.user.count({
                where: query ? {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                    ]
                } : undefined,
            })
        ]);

        return NextResponse.json({ users, total });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
