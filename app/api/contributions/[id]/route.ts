import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action } = body; // 'APPROVE' or 'REJECT'

        if (action === 'APPROVE') {
            // 1. Fetch contribution data
            const contribution = await prisma.contribution.findUnique({ where: { id } });
            if (!contribution) throw new Error('Contribution not found');

            const contributionData = JSON.parse(contribution.data);

            // 2. Create actual Resource
            await prisma.resource.create({
                data: {
                    title: contributionData.title,
                    type: contribution.type,
                    url: contributionData.url,
                    subjectId: contributionData.subjectId,
                    author: contribution.submittedBy
                }
            });

            // 3. Update status (Keep approved records for history)
            await prisma.contribution.update({
                where: { id },
                data: { status: 'APPROVED' }
            });
        } else {
            // REJECT ACTION -> DELETE and CLEANUP

            // 1. Fetch details to get the file URL
            const contribution = await prisma.contribution.findUnique({ where: { id } });

            if (contribution) {
                const data = JSON.parse(contribution.data);

                // 2. Delete from Cloudinary
                if (data.url && data.url.includes('cloudinary')) {
                    try {
                        const urlParts = data.url.split('/');
                        const uploadIndex = urlParts.indexOf('upload');
                        if (uploadIndex !== -1) {
                            let publicIdParts = urlParts.slice(uploadIndex + 1);
                            if (publicIdParts.length > 0 && publicIdParts[0].startsWith('v')) {
                                publicIdParts = publicIdParts.slice(1);
                            }
                            const publicIdWithExt = publicIdParts.join('/');
                            const publicId = publicIdWithExt.split('.').slice(0, -1).join('.');

                            await cloudinary.uploader.destroy(publicId);
                        }
                    } catch (err) {
                        console.error('Failed to cleanup rejected file from Cloudinary', err);
                    }
                }

                // 3. Delete Record completely
                await prisma.contribution.delete({
                    where: { id }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Contribution logic error:', error);
        return NextResponse.json({ error: 'Failed to process contribution' }, { status: 500 });
    }
}
