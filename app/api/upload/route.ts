import { NextResponse } from 'next/server';
import { uploadFileToDrive, getPendingFolderId } from '@/lib/google-drive';
import { Readable } from 'stream';
import { auth } from "@/lib/auth";

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
];

export async function POST(request: Request) {
    try {
        // 1. Authentication Check
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 2. File Type Validation
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json({
                error: 'Invalid file type. Only PDF and Images are allowed.'
            }, { status: 400 });
        }

        // Convert File to Node Stream
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        // Upload to Drive (Pending Folder)
        const driveFile = await uploadFileToDrive(
            stream,
            file.name,
            file.type || 'application/octet-stream'
        );

        return NextResponse.json({
            url: driveFile.webViewLink,
            driveId: driveFile.id
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({
            error: 'Upload failed',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
