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

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 50;
        const skip = (page - 1) * limit;

        const [logs, total] = await prisma.$transaction([
            prisma.activityLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: skip,
                include: {
                    user: {
                        select: { name: true, email: true, role: true }
                    }
                }
            }),
            prisma.activityLog.count()
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Logs Error:", error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
