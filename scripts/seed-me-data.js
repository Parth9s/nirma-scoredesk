
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BRANCH_NAME = "Mechanical Engineering";
const BRANCH_SLUG = "mechanical-engineering";

const subjectsData = {
    3: [
        { code: "2ME301", name: "Thermodynamics", credits: 3 },
        { code: "2ME101", name: "Material Science and Engineering", credits: 3 },
        { code: "2ME601", name: "Solid Mechanics and Geometric Modelling", credits: 3 },
        { code: "2ME801", name: "Mathematics for Mechanical Engineering", credits: 3 },
        { code: "2ME102", name: "Metrology and Quality Control", credits: 3 },
        { code: "2HS302", name: "Organisational Behavior", credits: 3 },
        { code: "2FT901", name: "Internship-Community Service", credits: 3 },
    ],
    4: [
        { code: "2ME302", name: "Fluid Mechanics", credits: 3 },
        { code: "2ME103", name: "Manufacturing Processes-I", credits: 3 },
        { code: "2ME701", name: "Automation and Control", credits: 3 },
        { code: "2ME501", name: "Theory of Machine", credits: 3 },
        { code: "2HS401", name: "Economics", credits: 3 },
        { code: "2MU803", name: "Indian Constitution and Citizenship", credits: 3 },
    ],
    5: [
        { code: "3ME101", name: "Manufacturing Process-II", credits: 3 },
        { code: "3ME102", name: "Design and Dynamics of Machines", credits: 3 },
        { code: "3ME103", name: "Heat and Mass Transfer", credits: 3 },
        { code: "3MEDEXX-I", name: "Department Elective-I", credits: 3 }, // Unique suffix
    ],
    6: [
        { code: "3ME201", name: "Energy Systems - I", credits: 3 },
        { code: "3ME202", name: "Machine Design - II", credits: 3 },
        { code: "3MEDEXX-II", name: "Department Elective - II", credits: 3 }, // Unique suffix
        { code: "3MEDEXX-III", name: "Department Elective - III", credits: 3 }, // Unique suffix
    ],
    7: [
        { code: "4ME101", name: "Manufacturing Technology and Management", credits: 3 },
        { code: "4ME102", name: "Energy Systems-II", credits: 3 },
        { code: "4ME103", name: "Minor Project", credits: 3 },
        { code: "4ME104", name: "Summer Internship", credits: 3 },
    ],
    8: [
        { code: "4ME201", name: "Major Project/Internship", credits: 3 },
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
