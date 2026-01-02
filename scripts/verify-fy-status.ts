
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Verifying FY Data...");

    // Check AIML
    const aiml = await prisma.branch.findFirst({
        where: { slug: 'artificial-intelligence-and-machine-learning' },
        include: { semesters: { where: { number: { in: [1, 2] } }, include: { subjects: true } } }
    });

    if (aiml) {
        console.log(`AIML Found: ${aiml.name}`);
        aiml.semesters.forEach(s => console.log(`  Sem ${s.number}: ${s.subjects.length} subjects`));
    } else {
        console.log("AIML Branch NOT Found");
    }

    // Check EI
    const ei = await prisma.branch.findFirst({
        where: { slug: 'electronics-and-instrumentation-engineering' },
        include: { semesters: { where: { number: { in: [1, 2] } }, include: { subjects: true } } }
    });

    if (ei) {
        console.log(`EI Found: ${ei.name}`);
        ei.semesters.forEach(s => console.log(`  Sem ${s.number}: ${s.subjects.length} subjects`));
    } else {
        console.log("EI Branch NOT Found");
    }

    // Check CSE
    const cse = await prisma.branch.findFirst({
        where: { slug: { contains: 'computer' } }, // Loose match
        include: { semesters: { where: { number: { in: [1, 2] } }, include: { subjects: true } } }
    });

    if (cse) {
        console.log(`CSE Found: ${cse.name}`);
        cse.semesters.forEach(s => console.log(`  Sem ${s.number}: ${s.subjects.length} subjects`));
    } else {
        console.log("CSE Branch NOT Found");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
