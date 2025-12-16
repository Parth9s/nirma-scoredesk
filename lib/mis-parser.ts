export interface AttendanceRecord {
    code: string;
    name: string;
    type: 'Lecture' | 'Lab' | 'Tutorial';
    attended: number;
    total: number;
    percentage: number;
}

export async function parseMISReport(file: File): Promise<AttendanceRecord[]> {
    if (file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        return parseMISHTML(file);
    } else {
        return parseMISPDF(file);
    }
}

export async function parseMISHTML(file: File): Promise<AttendanceRecord[]> {
    console.log("DEBUG: Starting HTML Parse...");
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    const records: AttendanceRecord[] = [];

    // MIS usually has a table with specific headers or just finding the main grid
    // We look for tr elements
    const rows = Array.from(doc.querySelectorAll('tr'));

    for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim());
        if (cells.length < 8) continue; // Skip header/short rows

        // Expected Index (approximate based on screenshot columns):
        // 0: Action (?)
        // 1: Code (e.g. 0FT002VA23)
        // 2: Name (e.g. Campus to Corporate)
        // 3: Short (e.g. CC-I)
        // 4: Load Type (L/T/P)
        // 5: Present
        // 6: Absent
        // 7: Total
        // 8: %

        // Validate if Cell 1 looks like a code
        const code = cells[1];
        if (!/^[A-Z0-9-]{5,15}$/.test(code)) continue;

        const typeChar = cells[4]; // "L", "T", "P" in the Load Type column
        let type: 'Lecture' | 'Lab' | 'Tutorial' = 'Lecture';
        if (typeChar === 'P') type = 'Lab';
        if (typeChar === 'T') type = 'Tutorial';

        const attended = parseInt(cells[5]);
        const total = parseInt(cells[7]);
        const percentage = parseInt(cells[8]);

        if (!isNaN(attended) && !isNaN(total)) {
            records.push({
                code,
                name: cells[2],
                type,
                attended,
                total,
                percentage
            });
        }
    }

    console.log(`DEBUG: Parsed ${records.length} records from HTML.`);
    return records;
}

export async function parseMISPDF(file: File): Promise<AttendanceRecord[]> {
    console.log("DEBUG: Starting PDF Parse...");

    // Dynamic import to avoid SSR/Build issues with pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker correctly
    // Use a fixed version corresponding to the installed package major version (v4 or v5) to be safe, 
    // or rely on the imported version if available.
    // We'll use the CDN for the worker.
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    // 1. Extract Text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
    }

    console.log("DEBUG: Extracted raw PDF text (first 500 chars):", fullText.substring(0, 500));

    const records: AttendanceRecord[] = [];

    // Regex for parsing
    // Format: Code Name Short Type P A T %
    const rowRegex = /([A-Z0-9]{5,15})\s+(.+?)\s+([A-Z0-9-]{2,10})\s+([LTP])\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/g;

    let match;
    while ((match = rowRegex.exec(fullText)) !== null) {
        const typeChar = match[4];
        let type: 'Lecture' | 'Lab' | 'Tutorial' = 'Lecture';
        if (typeChar === 'P') type = 'Lab';
        if (typeChar === 'T') type = 'Tutorial';

        records.push({
            code: match[1],
            name: match[2].trim(),
            type,
            attended: parseInt(match[5]),
            total: parseInt(match[7]),
            percentage: parseInt(match[8])
        });
    }

    console.log(`DEBUG: Parsed ${records.length} records from PDF.`);
    return records;
}
