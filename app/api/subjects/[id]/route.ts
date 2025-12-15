
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Delete dependencies first (EvaluationConfigs, Resources, etc.) if no cascade
        // We'll trust Prisma interactive transactions for atomicity
        await prisma.$transaction([
            prisma.evaluationConfig.deleteMany({ where: { subjectId: id } }),
            prisma.resource.deleteMany({ where: { subjectId: id } }),
            prisma.importantTopic.deleteMany({ where: { subjectId: id } }),
            prisma.subjectSchedule.deleteMany({ where: { subjectId: id } }),
            prisma.subject.delete({ where: { id } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete subject', details: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, code, credits, evaluationConfigs } = body;

        await prisma.$transaction(async (tx) => {
            // 1. Update basic info
            await tx.subject.update({
                where: { id },
                data: { name, code, credits }
            });

            // 2. Update Evaluation Configs if provided
            if (evaluationConfigs && Array.isArray(evaluationConfigs)) {
                // Wipe old configs
                await tx.evaluationConfig.deleteMany({ where: { subjectId: id } });

                // Create new ones
                // Ensure unique constraint [subjectId, type] isn't violated by duplicates in input
                // Filtering unique types might be needed, but we assume frontend sends valid data or we let it fail
                for (const config of evaluationConfigs) {
                    await tx.evaluationConfig.create({
                        data: {
                            subjectId: id,
                            type: config.type,
                            weight: Number(config.weight),
                            maxMarks: Number(config.maxMarks),
                            rules: JSON.stringify(config) // Backup full obj just in case
                        }
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('PATCH Error:', error);
        return NextResponse.json({ error: 'Failed to update subject', details: error.message }, { status: 500 });
    }
}
