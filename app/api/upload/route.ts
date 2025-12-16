import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary using a Promise wrapper around the stream
        const result = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'nirma_scoredesk_uploads',
                    resource_type: 'auto',
                    use_filename: true, // Use the uploaded filename
                    unique_filename: true, // Append random string to avoid overlap
                    filename_override: file.name, // Explicitly pass the original name
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            // Write buffer to stream
            uploadStream.end(buffer);
        });

        return NextResponse.json({ url: result.secure_url });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
