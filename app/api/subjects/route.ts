
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all subjects with relations
export async function GET() {
    try {
        const subjects = await prisma.subject.findMany({
            include: {
                semester: { include: { branch: true } },
                evaluationConfigs: true // Use correct relation name
            },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(subjects);
    } catch (error) {
        console.error('GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
    }
}

// POST: Create new subject
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, code, credits, branchName, semesterNumber } = body;

        // 1. Find or Create Branch
        let branch = await prisma.branch.findFirst({ where: { name: branchName } });
        if (!branch) {
            branch = await prisma.branch.create({
                data: {
                    name: branchName,
                    slug: branchName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                }
            });
        }

        // 2. Find or Create Semester
        let semester = await prisma.semester.findFirst({
            where: { number: semesterNumber, branchId: branch.id }
        });
        if (!semester) {
            semester = await prisma.semester.create({
                data: { number: semesterNumber, branchId: branch.id }
            });
        }

        // 3. Create Subject
        // Note: We don't handle evaluationConfigs here as the UI typically adds them via Edit later
        const subject = await prisma.subject.create({
            data: {
                name,
                code,
                credits,
                semesterId: semester.id,
                attendanceThreshold: 75
            }
        });

        return NextResponse.json(subject);
    } catch (error: any) {
        console.error('POST Error:', error);
        return NextResponse.json({ error: 'Failed to create subject', details: error?.message || 'Unknown' }, { status: 500 });
    }
}
