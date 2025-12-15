import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const count = await prisma.subject.count();
        if (count > 0) {
            return NextResponse.json({ message: 'Database already seeded', count });
        }

        const BRANCHES = [
            'Computer Science & Engineering',
            'Information Technology',
            'Electronics & Communication',
            'Civil Engineering',
            'Mechanical Engineering',
            'Chemical Engineering',
            'Electrical Engineering'
        ];

        // 1. Create Branches & Semesters
        for (const bName of BRANCHES) {
            const branch = await prisma.branch.upsert({
                where: { name: bName },
                update: {},
                create: {
                    name: bName,
                    slug: bName.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and'),
                }
            });

            for (let i = 1; i <= 8; i++) {
                await prisma.semester.upsert({
                    where: { branchId_number: { branchId: branch.id, number: i } },
                    update: {},
                    create: {
                        number: i,
                        branchId: branch.id
                    }
                });
            }
        }

        // 2. Create Subjects for CS / Sem 4
        const csBranch = await prisma.branch.findFirst({ where: { name: 'Computer Science & Engineering' } });
        if (csBranch) {
            const semester4 = await prisma.semester.findFirst({
                where: { branchId: csBranch.id, number: 4 }
            });

            if (semester4) {
                await prisma.subject.create({
                    data: {
                        name: 'Database Management Systems',
                        code: '2CS401',
                        credits: 4,
                        semesterId: semester4.id,
                        evaluationConfigs: {
                            create: [
                                { type: 'CE', weight: 20, maxMarks: 50 },
                                { type: 'LPW', weight: 40, maxMarks: 50 },
                                { type: 'SEE', weight: 40, maxMarks: 100 }
                            ]
                        },
                        resources: {
                            create: [
                                {
                                    title: 'Unit 1: Intro to SQL',
                                    type: 'NOTE',
                                    url: 'https://example.com/sql-notes',
                                    author: 'Admin'
                                }
                            ]
                        }
                    }
                });

                await prisma.subject.create({
                    data: {
                        name: 'Operating Systems',
                        code: '2CS402',
                        credits: 4,
                        semesterId: semester4.id,
                        evaluationConfigs: {
                            create: [
                                { type: 'CE', weight: 20, maxMarks: 50 },
                                { type: 'LPW', weight: 40, maxMarks: 50 },
                                { type: 'SEE', weight: 40, maxMarks: 100 }
                            ]
                        }
                    }
                });
            }
        }

        return NextResponse.json({ message: 'Seeding successful' });
    } catch (error) {
        console.error('Seeding error:', error);
        return NextResponse.json({ error: 'Seeding failed' }, { status: 500 });
    }
}
