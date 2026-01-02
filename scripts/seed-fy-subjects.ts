
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- 1. Define Subject Data ---

// Common Subjects
const COMMON_SEM1 = [
    { code: "2MA101", name: "Mathematics - I", credits: 4 },
    { code: "2CP101", name: "Computer Programming", credits: 4 }, // "CP"
];
const COMMON_SEM2 = [
    { code: "2MA201", name: "Mathematics - II", credits: 4 },
    { code: "2AI201", name: "Artificial Intelligence & Machine Learning", credits: 4 }, // "AI_ML"
];

// Cycle A (Physics Group) - Default Codes (Placeholders if unknown)
const CYCLE_A = [
    { code: "2PY101", name: "Physics", credits: 4 },
    { code: "2EE101", name: "Elements of Electrical Science", credits: 4 }, // "ELEC_SCI"
    { code: "2CH102", name: "Environmental Science", credits: 2 }, // "ENV" - assumption
    { code: "2EN101", name: "General English", credits: 2 }, // "GEN_ENG"
];

// Cycle B (Chemistry Group)
// Note: CHEMISTRY and WEB_IWP are mutually exclusive usually, but we define them here.
const CYCLE_B_BASE = [
    { code: "2MA102", name: "Statistics", credits: 2 }, // "STATS" - Code assumption
    { code: "2EN102", name: "Written Communication", credits: 2 }, // "WRT_COMM"
    { code: "2HU101", name: "Contemporary India", credits: 2 }, // "CONT_INDIA"
    { code: "2ME101", name: "Engineering Drawing & Workshop", credits: 4 }, // "ED_WS"
];

const CHEMISTRY_SUB = { code: "2CH101", name: "Chemistry", credits: 4 };
const IWP_SUB = { code: "2CS101", name: "Introduction to Web Programming", credits: 4 }; // "WEB_IWP"

// Branch Mapping Definitions
// G1 Branches: EC, EI, CH -> Sem 1: Cycle A, Sem 2: Cycle B
// G2 Branches: AIML, CL, EE, ME -> Sem 1: Cycle B, Sem 2: Cycle A
// CSE -> Split -> Sem 1 & Sem 2: Union of Cycle A & Cycle B (to be safe)

// Helper to get subjects by intent
const getSubjects = (program: 'CSE' | 'AIML' | 'OTHER', semester: 1 | 2, groupPreference: 'G1' | 'G2') => {
    let subjects = [];

    // Add Common Subjects
    if (semester === 1) subjects.push(...COMMON_SEM1);
    if (semester === 2) subjects.push(...COMMON_SEM2);

    // Determine Cycle
    // Logic:
    // If G1-preferring: Sem 1 = Cycle A, Sem 2 = Cycle B
    // If G2-preferring: Sem 1 = Cycle B, Sem 2 = Cycle A

    let useCycleA = false;
    let useCycleB = false;

    if (program === 'CSE') {
        // SPECIAL CASE: CSV has mixed groups. We provide ALL subjects in both sems to allow for student registration flexibility.
        useCycleA = true;
        useCycleB = true;
    } else {
        if (groupPreference === 'G1') {
            if (semester === 1) useCycleA = true;
            else useCycleB = true;
        } else { // G2
            if (semester === 1) useCycleB = true;
            else useCycleA = true;
        }
    }

    if (useCycleA) {
        subjects.push(...CYCLE_A);
    }

    if (useCycleB) {
        subjects.push(...CYCLE_B_BASE);
        // Special Handling for Chem vs IWP
        if (program === 'CSE' || program === 'AIML') {
            subjects.push(IWP_SUB);
        } else {
            subjects.push(CHEMISTRY_SUB);
        }
    }

    return subjects;
};

// Branch Configs
const BRANCH_CONFIGS: Record<string, { program: 'CSE' | 'AIML' | 'OTHER', group: 'G1' | 'G2' }> = {
    "Computer Science & Engineering": { program: 'CSE', group: 'G1' }, // Group irrelevant due to special case
    "Electronics & Communication": { program: 'OTHER', group: 'G1' },
    "Electronics and Instrumentation Engineering": { program: 'OTHER', group: 'G1' },
    "Chemical Engineering": { program: 'OTHER', group: 'G1' },
    "Artificial Intelligence & Machine Learning": { program: 'AIML', group: 'G2' }, // Inferred G2 from text
    "Civil Engineering": { program: 'OTHER', group: 'G2' },
    "Electrical Engineering": { program: 'OTHER', group: 'G2' },
    "Mechanical Engineering": { program: 'OTHER', group: 'G2' },
};

async function main() {
    console.log("Starting FY Subject Seeding...");

    for (const [branchName, config] of Object.entries(BRANCH_CONFIGS)) {
        console.log(`Processing ${branchName}...`);

        // 1. Get or Create Branch
        const slug = branchName.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and');
        let branch = await prisma.branch.findFirst({
            where: { OR: [{ name: branchName }, { slug: slug }] }
        });

        if (!branch) {
            console.log(`  Branch not found: ${branchName}, creating...`);
            branch = await prisma.branch.create({
                data: {
                    name: branchName,
                    slug: slug
                }
            });
        }

        // 2. Process Sem 1 & 2
        for (let semNum = 1; semNum <= 2; semNum++) {
            let semester = await prisma.semester.findFirst({
                where: { branchId: branch.id, number: semNum }
            });

            if (!semester) {
                console.log(`  Semester ${semNum} not found for ${branchName}, creating...`);
                semester = await prisma.semester.create({
                    data: {
                        branchId: branch.id,
                        number: semNum
                    }
                });
            }

            const subjectsToSeed = getSubjects(config.program, semNum as 1 | 2, config.group);

            for (const sub of subjectsToSeed) {
                // Upsert Subject
                // Note: We use a compound key logic if possible, or simple check
                // Schema has @@unique([code, semesterId])

                try {
                    await prisma.subject.upsert({
                        where: {
                            code_semesterId: {
                                code: sub.code,
                                semesterId: semester.id
                            }
                        },
                        update: {
                            name: sub.name,
                            credits: sub.credits
                        },
                        create: {
                            name: sub.name,
                            code: sub.code,
                            credits: sub.credits,
                            semesterId: semester.id,
                            attendanceThreshold: 75.0
                        }
                    });
                    // console.log(`    Seeded ${sub.code}: ${sub.name}`);
                } catch (e) {
                    console.error(`    Failed to seed ${sub.code} for ${branchName} Sem ${semNum}:`, e);
                }
            }
            console.log(`  Processed Sem ${semNum}: ${subjectsToSeed.length} subjects.`);
        }
    }

    console.log("FY Seeding Complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
