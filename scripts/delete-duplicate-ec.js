
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const DUPLICATE_SLUG = "electronics-and-communication-engineering";

    console.log(`Looking for branch with slug: ${DUPLICATE_SLUG}`);
    const branch = await prisma.branch.findUnique({
        where: { slug: DUPLICATE_SLUG },
        include: { semesters: { include: { subjects: true } } }
    });

    if (branch) {
        console.log(`Found duplicate branch: ${branch.name}. Deleting...`);
        // Prisma cascade delete might not be enabled or handled, so we might need to delete children first.
        // But typically schema handles this or we rely on cascading if configured.
        // Let's try deleting the branch directly.

        // Delete subjects first just in case
        for (const sem of branch.semesters) {
            await prisma.subject.deleteMany({
                where: { semesterId: sem.id }
            });
            await prisma.semester.delete({
                where: { id: sem.id }
            });
        }

        await prisma.branch.delete({
            where: { id: branch.id }
        });
        console.log("Deleted duplicate branch successfully.");
    } else {
        console.log("Duplicate branch not found.");
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
