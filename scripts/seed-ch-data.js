
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BRANCH_NAME = "Chemical Engineering";
const BRANCH_SLUG = "chemical-engineering";

const subjectsData = {
    3: [
        { code: "2CH201CC23", name: "Heat Transfer Operations", credits: 3 },
        { code: "2CH202CC23", name: "Solid Fluid Operations", credits: 3 },
        { code: "2CH203CC23", name: "Fluid Flow Operations", credits: 3 },
        { code: "2CH801CC23", name: "Mathematics for Chemical Engineering", credits: 3 },
        { code: "2HS401CC23", name: "Organisational Behaviour", credits: 3 },
        { code: "2CH603CC25", name: "Process Calculation", credits: 3 },
        { code: "2FT901CC23", name: "Internship-Community Services", credits: 3 },
    ],
    4: [
        { code: "2CH204CC23", name: "Mass Transfer Operations-I", credits: 3 },
        { code: "2CH401CC25", name: "Chemical Process Industries", credits: 3 },
        { code: "2CH602CC23", name: "Chemical Engineering Thermodynamics", credits: 3 },
        { code: "2HS302CC23", name: "Economics", credits: 3 },
        { code: "1MU803CC22", name: "Indian Constitution and Citizenship", credits: 3 },
        { code: "2CH101CC23", name: "Organic Chemistry", credits: 3 },
    ],
    5: [
        { code: "3CH201CC24", name: "Mass Transfer Operations-II", credits: 3 },
        { code: "3CH301CC24", name: "Chemical Reaction Engineering-I", credits: 3 },
        { code: "3CH501CC24", name: "Process Equipment Design", credits: 3 },
        { code: "3CH602DC24", name: "Transport Phenomena (Minor)", credits: 3 },
    ],
    6: [
        { code: "3CH302CC24", name: "Chemical Reaction Engineering-II", credits: 3 },
        { code: "3CH502CC24", name: "Modeling and Process Simulations", credits: 3 },
        { code: "4FT901CC24", name: "Research Methodology and Seminar", credits: 3 },
        { code: "3CH603DC24", name: "Plantwide Process Control (Minor)", credits: 3 },
    ],
    7: [
        { code: "4CH101CC25", name: "Plant Design, Economics and Project Management", credits: 3 },
        { code: "4CH102CC25", name: "Biochemical Engineering", credits: 3 },
        { code: "4CH103CC25", name: "Minor Project", credits: 3 },
        { code: "4CH104CC25", name: "Summer Internship", credits: 3 },
    ],
    8: [
        { code: "4CH201CC25", name: "Major Project/Internship", credits: 3 },
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
