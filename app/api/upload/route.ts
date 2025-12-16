import { NextResponse } from 'next/server';
import { uploadFileToDrive, getPendingFolderId } from '@/lib/google-drive';
import { Readable } from 'stream';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Convert File to Node Stream
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        // Upload to Drive (Pending Folder)
        // Note: The library function will handle finding the Pending folder if not explicitly passed,
        // but it's cleaner to get it here or inside. Our lib currently defaults to Pending if folderId is missing?
        // Let's rely on the library logic we wrote or call getPendingFolderId.
        // We updated the lib to take optional folderId. We'll pass nothing to use default logic or get explicit pending ID.

        // Wait, current implementation of uploadFileToDrive requires targetFolderId or it fails if ROOT not set.
        // But we set logic: "const targetFolderId = folderId || await getFolderId('Pending', ROOT_FOLDER_ID!);"
        // So passing undefined is fine.

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
