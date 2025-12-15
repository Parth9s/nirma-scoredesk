import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const branchName = searchParams.get('branch');
    const semesterNum = searchParams.get('semester');

    if (!branchName || !semesterNum) {
        return NextResponse.json({ error: 'Missing branch/semester' }, { status: 400 });
    }

    try {
        const branch = await prisma.branch.findUnique({
            where: { name: branchName },
            include: {
                semesters: {
                    where: { number: Number(semesterNum) },
                    select: {
                        id: true,
                        academicCalendarUrl: true
                    }
                }
            }
        });

        if (!branch || branch.semesters.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const sem = branch.semesters[0];
        return NextResponse.json({
            id: sem.id,
            academicCalendarUrl: sem.academicCalendarUrl
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { branch, semester, url } = body;

        if (!branch || !semester || !url) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Find or Create Context
        let branchRec = await prisma.branch.findUnique({ where: { name: branch } });
        if (!branchRec) {
            // Check slug
            // Sluggify
            const slug = branch.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            branchRec = await prisma.branch.create({
                data: { name: branch, slug }
            });
        }

        const semRec = await prisma.semester.upsert({
            where: {
                branchId_number: {
                    branchId: branchRec.id,
                    number: Number(semester)
                }
            },
            update: {
                academicCalendarUrl: url
            },
            create: {
                branchId: branchRec.id,
                number: Number(semester),
                academicCalendarUrl: url
            }
        });

        return NextResponse.json(semRec);
    } catch (error: any) {
        console.error('Calendar Save Error:', error);
        // Add more detail if possible
        const msg = error?.message || 'Unknown error';
        console.error('Detailed Error:', msg);
        return NextResponse.json({ error: 'Failed to save', details: msg }, { status: 500 });
    }
}
