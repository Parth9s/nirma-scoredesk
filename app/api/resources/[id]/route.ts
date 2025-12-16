import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // 1. Find Resource 
        const resource = await prisma.resource.findUnique({
            where: { id }
        });

        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        // 2. Delete from Google Drive (Attempt)
        if (resource.url && resource.url.includes('drive.google.com')) {
            try {
                // Extract File ID from URL
                // Common Formats:
                // https://drive.google.com/file/d/FILE_ID/view...
                // https://docs.google.com/file/d/FILE_ID/edit...
                const matches = resource.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                if (matches && matches[1]) {
                    const fileId = matches[1];
                    const { deleteFile } = await import('@/lib/google-drive');
                    await deleteFile(fileId);
                }
            } catch (driveErr) {
                console.error('Failed to cleanup Drive file:', driveErr);
            }
        }

        // 3. Delete from Database
        await prisma.resource.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
    }
}
