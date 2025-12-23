
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const branches = await prisma.branch.findMany({
        include: {
            _count: {
                select: { semesters: true }
            },
            semesters: {
                include: {
                    _count: {
                        select: { subjects: true }
                    }
                }
            }
        }
    });

    console.log("Existing Branches:");
    branches.forEach(b => {
        console.log(`- [${b.id}] ${b.name} (${b.slug})`);
        console.log(`  Semesters: ${b._count.semesters}`);
        let totalSubjects = 0;
        b.semesters.forEach(sem => {
            totalSubjects += sem._count.subjects;
            if (sem._count.subjects > 0) {
                console.log(`    Sem ${sem.number}: ${sem._count.subjects} subjects`);
            }
        });
        console.log(`  Total Subjects: ${totalSubjects}`);
        console.log('---');
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
