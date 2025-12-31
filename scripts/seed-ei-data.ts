
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BRANCH_NAME = "Electronics & Instrumentation Engineering";
const BRANCH_SLUG = "electronics-and-instrumentation-engineering";

const subjectsData: Record<number, { code: string; name: string; credits: number }[]> = {
    3: [
        { code: "2EI101CC23", name: "Control Theory", credits: 3 },
        { code: "2EI601CC25", name: "Basic Electronics", credits: 3 },
        { code: "2EI102CC25", name: "Circuit Theory", credits: 3 },
        { code: "2EI103CC23", name: "Software for Engineers", credits: 3 },
        { code: "2EI801CC23", name: "Mathematics for Electronics and Instrumentation Engineering", credits: 3 },
        { code: "2HS302CC23", name: "Economics", credits: 3 },
        { code: "2FT901CC23", name: "Internship Community Services", credits: 3 },
    ],
    4: [
        { code: "2EI602CC23", name: "Applied Electronics", credits: 3 },
        { code: "2EI603CC23", name: "Electronics Circuits", credits: 3 },
        { code: "2EI604CC23", name: "Microcontroller and its Application", credits: 3 },
        { code: "2EI104CC23", name: "Programmable Logic Controllers", credits: 3 },
        { code: "2HS401CC23", name: "Organisational Behavior", credits: 3 },
        { code: "1MU803CC23", name: "Indian Constitution and Citizenship", credits: 3 },
    ],
    5: [
        { code: "3EI101CC24", name: "Industrial Control", credits: 3 },
        { code: "3EI401CC24", name: "Transducer and Measurement", credits: 3 },
        { code: "3EI102CC24", name: "Industrial Drives", credits: 3 },
        { code: "3EI301ME24", name: "Fundamentals of Robotics", credits: 3 },
        { code: "3EI601ME24", name: "Digital Design for Instrumentation", credits: 3 },
    ],
    6: [
        { code: "3EI105CC24", name: "Industrial Instrumentation", credits: 3 },
        { code: "3EI106CC24", name: "Process Automation", credits: 3 },
        { code: "4FT901CC24", name: "Research Methodology and Seminar", credits: 3 },
        { code: "3EI603ME24", name: "Image Processing and Applications", credits: 3 },
    ],
    7: [
        { code: "4EI101CC25", name: "Embedded System Design", credits: 3 },
        { code: "4EI102CC25", name: "Factory Automation", credits: 3 },
        { code: "4EI103CC25", name: "IoT Applications in Automation", credits: 3 },
    ],
    8: [
        { code: "4EI201CC25", name: "Major Project/Internship", credits: 3 },
    ]
};

async function main() {
    console.log(`Checking Branch: ${BRANCH_NAME}`);

    // 1. Upsert Branch
    let branch = await prisma.branch.findFirst({
        where: {
            OR: [
                { name: BRANCH_NAME },
                { slug: BRANCH_SLUG }
            ]
        }
    });

    if (!branch) {
        branch = await prisma.branch.create({
            data: {
                name: BRANCH_NAME,
                slug: BRANCH_SLUG,
            }
        });
        console.log(`Created Branch: ${branch.name}`);
    } else {
        console.log(`Verified Branch: ${branch.name} (${branch.id})`);
    }

    // 2. Iterate Semesters
    for (const [semNumStr, subjects] of Object.entries(subjectsData)) {
        const semNum = parseInt(semNumStr);
        console.log(`Processing Semester ${semNum}...`);

        // Upsert Semester
        // Note: Schema has @@unique([branchId, number]) for Semester, 
        // but Prisma `upsert` needs a unique constraint field. 
        // We can use findFirst to check existence.
        let semester = await prisma.semester.findFirst({
            where: { branchId: branch.id, number: semNum }
        });

        if (!semester) {
            semester = await prisma.semester.create({
                data: {
                    number: semNum,
                    branchId: branch.id
                }
            });
            console.log(`Created Semester ${semNum}`);
        } else {
            console.log(`Found Semester ${semNum}`);
        }

        // 3. Upsert Subjects
        for (const sub of subjects) {
            // Check if subject exists by code (which is unique globally properly, or needs to be unique)
            // Schema: code String @unique

            // Handle code conflict if same code used in other branch?
            // Schema says code is @unique globally.
            // Assuming codes are unique.

            await prisma.subject.upsert({
                where: {
                    code_semesterId: {
                        code: sub.code,
                        semesterId: semester.id
                    }
                },
                update: {
                    name: sub.name,
                    credits: sub.credits,
                    // semesterId is part of unique key, unlikely to change, but good to keep consistency
                },
                create: {
                    name: sub.name,
                    code: sub.code,
                    credits: sub.credits,
                    semesterId: semester.id,
                    attendanceThreshold: 75
                }
            });
        }
        console.log(`Processed ${subjects.length} subjects for Semester ${semNum}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
