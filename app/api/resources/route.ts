import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const type = searchParams.get('type');
    const branchName = searchParams.get('branch');
    const semesterNumber = searchParams.get('semester');

    const whereClause: any = {
        subjectId: subjectId || undefined,
        type: type ? (type as any) : undefined
    };

    if (branchName || semesterNumber) {
        whereClause.subject = { semester: {} };

        if (semesterNumber) {
            whereClause.subject.semester.number = parseInt(semesterNumber);
        }

        if (branchName) {
            whereClause.subject.semester.branch = { name: branchName };
        }
    }

    try {
        const resources = await prisma.resource.findMany({
            where: whereClause,
            include: { subject: { include: { semester: { include: { branch: true } } } } },
            orderBy: { uploadedAt: 'desc' }
        });
        return NextResponse.json(resources);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Extended body to include driveId if available (passed from frontend upload)
        const { title, description, type, url, subjectId, author, driveId } = body;

        // If a Drive File ID is present, we must organize it!
        if (driveId) {
            try {
                // 1. Fetch Subject for hierarchy
                const subject = await prisma.subject.findUnique({
                    where: { id: subjectId },
                    include: { semester: { include: { branch: true } } }
                });

                if (subject) {
                    const { ensureHierarchy, moveFile, setPublicPermission, getPendingFolderId } = await import('@/lib/google-drive');

                    const branchName = subject.semester.branch.name;
                    const semNumber = subject.semester.number;

                    const targetFolderId = await ensureHierarchy(branchName, semNumber);
                    const pendingFolderId = await getPendingFolderId();

                    // Move and Share
                    await moveFile(driveId, pendingFolderId, targetFolderId);
                    await setPublicPermission(driveId);
                    console.log(`[Drive] File ${driveId} organized for ${branchName} Sem ${semNumber}`);
                }
            } catch (driveError) {
                console.error("Failed to organize Drive file during Resource Create:", driveError);
                // We don't block resource creation, but warn.
            }
        }

        const resource = await prisma.resource.create({
            data: {
                title,
                description,
                type,
                url, // Web View Link
                subjectId,
                author: author || 'Admin'
            }
        });
        return NextResponse.json(resource);
    } catch (error) {
        console.error("Create Resource Error:", error);
        return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
    }
}
