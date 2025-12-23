
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BRANCH_NAME = "Electronics & Communication";
const BRANCH_SLUG = "electronics-and-communication";

const subjectsData = {
    3: [
        { code: "2EC101CC23", name: "Electronic Devices and Circuits", credits: 3 },
        { code: "2EC201CC23", name: "Digital Logic Design", credits: 3 },
        { code: "2EC401CC23", name: "Signals and Systems", credits: 3 },
        { code: "2EC801CC23", name: "Mathematics for Electronics & Communication Engineering", credits: 3 },
        { code: "2HS302CC23", name: "Economics", credits: 3 },
        { code: "1MU803CC22", name: "Indian Constitution and Citizenship", credits: 3 },
        { code: "2FT901CC23", name: "Internship-Community Service", credits: 3 },
    ],
    4: [
        { code: "2EC102CC23", name: "Analog Electronics", credits: 3 },
        { code: "2EC701CC23", name: "Microcontrollers and Interfacing", credits: 3 },
        { code: "2EC402CC23", name: "Digital Signal Processing", credits: 3 },
        { code: "2EC301CC23", name: "Communication Systems", credits: 3 },
        { code: "2EC202CC23", name: "FPGA based System Design", credits: 3 },
        { code: "2HS401CC23", name: "Organisational Behaviour", credits: 3 },
    ],
    5: [
        { code: "3EC601CC24", name: "VLSI Design", credits: 3 },
        { code: "3EC301CC24", name: "Digital Communication", credits: 3 },
        { code: "3EC302CC24", name: "Electromagnetic & Wave Propagation", credits: 3 },
    ],
    6: [
        { code: "3EC503CC24", name: "Computer Architecture", credits: 3 },
        { code: "3EC705CC24", name: "Embedded System", credits: 3 },
        { code: "4FT901CC24", name: "Research Methodology and Seminar", credits: 3 },
    ],
    7: [
        { code: "4EC301CC25", name: "Data Communication and Network", credits: 3 },
    ],
    8: [
        { code: "2EC801", name: "Major Project", credits: 3 },
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
