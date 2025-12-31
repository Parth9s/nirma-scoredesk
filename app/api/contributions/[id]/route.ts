import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureHierarchy, moveFile, setPublicPermission, getPendingFolderId, deleteFile } from '@/lib/google-drive';

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
            // Expecting contributionData to have { driveId, url, subjectId, title... }

            // 2. Fetch Subject details (for Folder Hierarchy)
            const subject = await prisma.subject.findUnique({
                where: { id: contributionData.subjectId },
                include: { semester: { include: { branch: true } } }
            });

            if (!subject) throw new Error('Subject not found');

            const driveId = contributionData.driveId;

            // 3. Move File in Google Drive (If driveId exists)
            // If it was an external link text contribution, driveId might be missing.
            if (driveId) {
                try {
                    // a) Get Headers
                    const branchName = subject.semester.branch.name;
                    const semNumber = subject.semester.number;

                    // b) Ensure Target Folder
                    const targetFolderId = await ensureHierarchy(branchName, semNumber);
                    const pendingFolderId = await getPendingFolderId();

                    // c) Move File
                    await moveFile(driveId, pendingFolderId, targetFolderId);

                    // d) Make Public
                    await setPublicPermission(driveId);

                    // Update URL just in case? Usually webViewLink stays same.
                } catch (driveError) {
                    console.error("Drive Move/Share Failed:", driveError);
                    // Continue anyway? Or fail? 
                    // Let's log warning but proceed to create resource, 
                    // or maybe update the user that permissions might be wrong.
                    // Ideally we want to fail so Admin knows.
                    throw new Error("Failed to organize file in Drive: " + (driveError as any).message);
                }
            }

            // 4. Create actual Resource
            await prisma.resource.create({
                data: {
                    title: contributionData.title,
                    description: contributionData.description,
                    type: contribution.type,
                    url: contributionData.url, // Keep the webViewLink
                    subjectId: contributionData.subjectId,
                    author: contribution.submittedBy
                }
            });

            // 5. Update status
            await prisma.contribution.update({
                where: { id },
                data: { status: 'APPROVED' }
            });
        } else {
            // REJECT ACTION -> DELETE and CLEANUP
            const contribution = await prisma.contribution.findUnique({ where: { id } });

            if (contribution) {
                const data = JSON.parse(contribution.data);

                // Delete from Drive if driveId exists
                if (data.driveId) {
                    await deleteFile(data.driveId);
                }

                await prisma.contribution.delete({
                    where: { id }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Contribution logic error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process contribution' }, { status: 500 });
    }
}
