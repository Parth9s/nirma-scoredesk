import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const type = searchParams.get('type');

    // if (!subjectId) {
    //    return NextResponse.json({ error: 'Subject ID required' }, { status: 400 });
    // }

    try {
        const resources = await prisma.resource.findMany({
            where: {
                subjectId: subjectId || undefined,
                type: type ? (type as any) : undefined
            },
            include: { subject: { include: { semester: { include: { branch: true } } } } },
            orderBy: { uploadedAt: 'desc' }
        });
        return NextResponse.json(resources);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, type, url, subjectId, author } = body;

        const resource = await prisma.resource.create({
            data: {
                title,
                type,
                url,
                subjectId,
                author: author || 'Admin'
            }
        });
        return NextResponse.json(resource);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
    }
}
