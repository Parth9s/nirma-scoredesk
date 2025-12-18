import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.holiday.delete({
            where: {
                id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete holiday:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
