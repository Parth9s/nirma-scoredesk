import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, faculty } = body;

        if (!id || !name || !faculty) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // 1. Record the download
        await prisma.peerAssignmentDownload.create({
            data: {
                assignmentId: id,
                downloaderName: name,
                downloaderFaculty: faculty
            }
        });

        // 2. Increment the counter (for fast sort/display)
        await prisma.peerAssignment.update({
            where: { id },
            data: {
                downloadCount: { increment: 1 }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to record download:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
