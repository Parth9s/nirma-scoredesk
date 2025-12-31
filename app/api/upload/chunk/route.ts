import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const uploadUri = searchParams.get('uploadUri');

        if (!uploadUri) {
            return NextResponse.json({ error: 'Missing uploadUri' }, { status: 400 });
        }

        // Forward headers like Content-Range and Content-Length
        const range = request.headers.get('Content-Range');
        const length = request.headers.get('Content-Length');

        if (!range) {
            return NextResponse.json({ error: 'Missing Content-Range header' }, { status: 400 });
        }

        // Read chunk from request body
        const chunk = await request.arrayBuffer();

        // Proxy to Google Drive
        const response = await fetch(uploadUri, {
            method: 'PUT',
            headers: {
                'Content-Length': length || chunk.byteLength.toString(),
                'Content-Range': range,
            },
            body: Buffer.from(chunk)
        });

        console.log(`[Chunk] Sent range ${range}. Drive Status: ${response.status}`);

        // 308 Resume Incomplete is NORMAL for chunks
        if (response.status === 308) {
            return NextResponse.json({ status: 'partial' }, { status: 200 });
        }

        // 200 or 201 means done
        if (response.ok) {
            const text = await response.text();

            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (e) {
                console.error("[Chunk] Failed to parse Drive response JSON:", text);
                return NextResponse.json({ error: 'Invalid JSON from Drive', details: text }, { status: 502 });
            }

            // If we got a file ID, it's success
            if (data.id) {
                return NextResponse.json({
                    status: 'complete',
                    file: data
                });
            } else {
                // Sometimes Drive returns success but different structure?
                console.warn("[Chunk] Drive returned OK but no ID:", data);
                return NextResponse.json({ status: 'complete', file: data });
            }
        }

        // Error
        const errorText = await response.text();
        console.error("Drive Proxy Error:", response.status, errorText);
        return NextResponse.json({ error: 'Drive upload failed', details: errorText }, { status: response.status });

    } catch (error: any) {
        console.error("Chunk Proxy Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
