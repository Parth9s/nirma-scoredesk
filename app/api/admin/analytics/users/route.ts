import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const session = await auth();
        // @ts-ignore
        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        // 1. Active Users Count (Heartbeat within last 5 mins)
        const activeUsersCount = await prisma.user.count({
            where: {
                lastActive: {
                    gte: fiveMinutesAgo
                }
            }
        });

        // 2. Recently Active Users List
        const activeUsers = await prisma.user.findMany({
            where: {
                lastActive: {
                    gte: fiveMinutesAgo
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                lastActive: true,
                role: true
            },
            take: 20
        });

        // 3. Recent Logins (from ActivityLog)
        const recentLogins = await prisma.activityLog.findMany({
            where: { action: 'LOGIN' },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        return NextResponse.json({
            activeCount: activeUsersCount,
            activeUsers,
            recentLogins
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
