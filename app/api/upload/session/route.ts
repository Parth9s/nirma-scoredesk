import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getResumableUploadUri } from '@/lib/google-drive';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { filename, type, size } = await request.json();

        if (!filename || !type) {
            return NextResponse.json({ error: 'Missing filename or type' }, { status: 400 });
        }

        const uploadUri = await getResumableUploadUri(filename, type);

        return NextResponse.json({ uploadUri });
    } catch (error: any) {
        console.error("Failed to start upload session:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
