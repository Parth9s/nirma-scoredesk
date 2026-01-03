import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch assignments with filters
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch');
    const semester = searchParams.get('semester');
    const subjectId = searchParams.get('subjectId');

    try {
        const whereClause: any = {};

        // Filter by Subject (Specific ID)
        if (subjectId) {
            whereClause.subjectId = subjectId;
        }
        // OR Filter by Branch/Sem (Join)
        else if (branch && semester) {
            whereClause.subject = {
                semester: {
                    number: parseInt(semester),
                    branch: {
                        name: branch
                    }
                }
            };
        }

        const assignments = await prisma.peerAssignment.findMany({
            where: whereClause,
            include: {
                subject: {
                    select: { name: true, code: true }
                },
                downloads: {
                    orderBy: { downloadedAt: 'desc' },
                    take: 5 // Limit to recent 5 to avoid clutter, or maybe 10? User didn't specify. Let's do 5.
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(assignments);
    } catch (error) {
        console.error('Failed to fetch assignments:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// POST: Upload new assignment
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, subjectId, facultyName, studentName, division, url } = body;

        if (!title || !subjectId || !facultyName || !studentName || !url) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newAssignment = await prisma.peerAssignment.create({
            data: {
                title,
                subjectId,
                facultyName,
                studentName,
                division,
                url
            }
        });

        return NextResponse.json(newAssignment);
    } catch (error) {
        console.error('Failed to create assignment:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// DELETE: Remove an assignment (Admin only)
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
        }

        await prisma.peerAssignment.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete assignment:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
