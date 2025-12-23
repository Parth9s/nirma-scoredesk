
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BRANCH_NAME = "Civil Engineering";
const BRANCH_SLUG = "civil-engineering";

const subjectsData = {
    3: [
        { code: "2CL101CC23", name: "Mechanics of Solids", credits: 3 },
        { code: "2CL701CC23", name: "Surveying", credits: 3 },
        { code: "2CL102CC23", name: "Construction Materials", credits: 3 },
        { code: "2CL801CC23", name: "Mathematics for Civil Engineering", credits: 3 },
        { code: "2CL201CC23", name: "Civil Engineering Drawing and Building Planning", credits: 3 },
        { code: "2HS401CC23", name: "Organizational Behaviour", credits: 3 },
        { code: "2FT901CC23", name: "Internship-Community Services", credits: 3 },
    ],
    4: [
        { code: "2CL103CC23", name: "Structural Mechanics", credits: 3 },
        { code: "2CL202CC23", name: "Construction Technology", credits: 3 },
        { code: "2CL401CC23", name: "Geotechnical Engineering", credits: 3 },
        { code: "2CL301CC23", name: "Transportation Engineering", credits: 3 },
        { code: "2HS302CC23", name: "Economics", credits: 3 },
        { code: "1MU803CC23", name: "Indian Constitution and Citizenship", credits: 3 },
    ],
    5: [
        { code: "3CL101CC24", name: "Design of Concrete Structures", credits: 3 },
        { code: "3CL601CC24", name: "Hydraulics and Water Resources Engineering", credits: 3 },
        { code: "3CL501CC24", name: "Environmental Engineering", credits: 3 },
        { code: "3CLXXXME24-I", name: "Department Elective – I", credits: 3 }, // Unique suffix added
    ],
    6: [
        { code: "3CL207CC24", name: "Construction Project Management", credits: 3 },
        { code: "3CL105CC24", name: "Design of Steel Structures", credits: 3 },
        { code: "4FT901CC24", name: "Research Methodology and Seminar", credits: 3 }, // Note: duplicate code in sem 7
        { code: "3CLXXXME24-II", name: "Department Elective-II", credits: 3 }, // Unique suffix added
    ],
    7: [
        { code: "4CL201CC25", name: "Professional Practice", credits: 3 },
        // { code: "4FT901CC24", name: "Research Methodology and Seminar", credits: 3 }, // Commented out duplicate to avoid moving it from Sem 6 or confusing valid sem.
        { code: "4CLXXME25-III", name: "Department Elective-III", credits: 3 }, // Unique suffix added
        { code: "4CLXXME25-IV", name: "Department Elective-IV", credits: 3 }, // Unique suffix added
    ],
    8: [
        { code: "4FT902CC25", name: "Internship / Research Project", credits: 3 },
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
        console.log(`Created Branch: ${BRANCH_NAME}`);
    } else {
        console.log(`Found Existing Branch: ${branch.name}`);
    }

    // 2. Iterate Semesters
    for (const [semNumStr, subjects] of Object.entries(subjectsData)) {
        const semNum = parseInt(semNumStr);
        console.log(`Processing Semester ${semNum}...`);

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
        }

        // 3. Upsert Subjects
        for (const sub of subjects) {
            await prisma.subject.upsert({
                where: { code: sub.code },
                update: {
                    name: sub.name,
                    credits: sub.credits,
                    semesterId: semester.id,
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
