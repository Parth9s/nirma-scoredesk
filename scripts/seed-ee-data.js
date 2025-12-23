
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BRANCH_NAME = "Electrical Engineering";
const BRANCH_SLUG = "electrical-engineering";

const subjectsData = {
    3: [
        { code: "2EE801CC23", name: "Mathematical Applications in Electrical Engineering", credits: 3 },
        { code: "2EE301CC23", name: "Analog Electronics", credits: 3 },
        { code: "2EE302CC23", name: "Digital Electronics", credits: 3 },
        { code: "2EE501CC23", name: "Electrical Measurements and Transducers", credits: 3 },
        { code: "2EE502CC23", name: "Network Analysis", credits: 3 },
        { code: "2HS401CC23", name: "Organisational Behaviour", credits: 3 },
        { code: "2FT901CC23", name: "Internship – Community Services", credits: 3 },
    ],
    4: [
        { code: "2EE201CC23", name: "Fundamentals of Power System", credits: 3 },
        { code: "2EE101CC23", name: "Transformers and DC Machines", credits: 3 },
        { code: "2EE503CC23", name: "Microprocessor and Microcontrollers", credits: 3 },
        { code: "2EE504CC23", name: "Control System Theory", credits: 3 },
        { code: "2HS302CC23", name: "Economics", credits: 3 },
        { code: "1MU803CC23", name: "Indian Constitution and Citizenship", credits: 3 },
    ],
    5: [
        { code: "3EE101CC24", name: "Rotating AC Machines", credits: 3 },
        { code: "3EE201CC24", name: "Electrical Power System Analysis", credits: 3 },
        { code: "3EE301CC24", name: "Power Electronics and Applications", credits: 3 },
    ],
    6: [
        { code: "3EE207CC24", name: "Power System Protection and Switchgears", credits: 3 },
        { code: "3EE306CC24", name: "Electric Drives", credits: 3 },
        { code: "4FT901CC24", name: "Research Methodology and Seminar", credits: 3 },
    ],
    7: [
        { code: "4EE101CC25", name: "Electrical Design", credits: 3 },
    ],
    8: [
        { code: "4EE301ME25", name: "Multi-level Converters", credits: 3 },
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
