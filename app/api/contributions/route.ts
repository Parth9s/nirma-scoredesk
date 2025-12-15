import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, type, url, subjectId, author } = body; // data payload

        // Store contribution as pending
        const contribution = await prisma.contribution.create({
            data: {
                type,
                status: 'PENDING',
                data: JSON.stringify({ title, url, subjectId }), // Store details in JSON string
                submittedBy: author
            }
        });
        return NextResponse.json(contribution);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to submit contribution' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const contributions = await prisma.contribution.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(contributions);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 });
    }
}
