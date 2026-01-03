import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        // @ts-ignore
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { hasGlobalAccess, isBanned } = body;

        const updateData: any = {};
        if (typeof hasGlobalAccess === 'boolean') updateData.hasGlobalAccess = hasGlobalAccess;
        if (typeof isBanned === 'boolean') updateData.isBanned = isBanned;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user access' }, { status: 500 });
    }
}
