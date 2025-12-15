import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // 1. Find Resource to get URL
        const resource = await prisma.resource.findUnique({
            where: { id }
        });

        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        // 2. Delete file from Cloudinary (if it's a Cloudinary URL)
        if (resource.url.includes('cloudinary')) {
            try {
                // Extract Public ID
                // URL example: https://res.cloudinary.com/cloudname/image/upload/v1234/nirma_scoredesk_uploads/filename.pdf
                // We need: nirma_scoredesk_uploads/filename
                const urlParts = resource.url.split('/');
                const versionIndex = urlParts.findIndex(part => part.startsWith('v') && !isNaN(Number(part.substring(1))));

                // If version found, everything after is path. If not, maybe after 'upload'?
                // Simple strategy: Grab everything after "upload/" and remove version if present

                const uploadIndex = urlParts.indexOf('upload');
                if (uploadIndex !== -1) {
                    let publicIdParts = urlParts.slice(uploadIndex + 1);
                    // Remove version (v12345) if present
                    if (publicIdParts.length > 0 && publicIdParts[0].startsWith('v')) {
                        publicIdParts = publicIdParts.slice(1);
                    }

                    const publicIdWithExt = publicIdParts.join('/');
                    // Remove extension
                    const publicId = publicIdWithExt.split('.').slice(0, -1).join('.');

                    console.log('Deleting Cloudinary File:', publicId);
                    await cloudinary.uploader.destroy(publicId);
                }
            } catch (cloudError) {
                console.error('Cloudinary Deletion Error (Continuing DB delete):', cloudError);
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
