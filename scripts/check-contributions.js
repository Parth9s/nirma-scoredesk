const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const contributions = await prisma.contribution.findMany({
            where: { status: 'APPROVED' },
            orderBy: { updatedAt: 'desc' },
            take: 5
        });

        console.log("Last 5 Approved Contributions:");
        contributions.forEach(c => {
            const data = JSON.parse(c.data);
            console.log(`ID: ${c.id}`);
            console.log(`Title: ${data.title}`);
            console.log(`Drive ID: ${data.driveId}`);
            console.log(`Updated At: ${c.updatedAt}`);
            console.log('---');
        });
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
