import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BRANCHES = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Civil Engineering',
    'Mechanical Engineering',
    'Chemical Engineering',
    'Electrical Engineering'
];

async function main() {
    console.log('Start seeding...');

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

        // Create 8 semesters for each branch
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
            // DBMS
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

            // OS
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

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
