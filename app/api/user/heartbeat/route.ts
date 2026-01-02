import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Update lastActive timestamp
        try {
            await prisma.user.update({
                where: { email: session.user.email },
                data: { lastActive: new Date() }
            });
        } catch (error: any) {
            // P2025: Record to update not found.
            // This happens if the DB was reset but the browser has a stale session cookie.
            // We can safely ignore this as the user isn't in the DB anyway.
            if (error.code !== 'P2025') {
                console.error("Heartbeat error:", error);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
