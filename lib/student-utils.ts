export const BRANCH_MAPPING: Record<string, string> = {
    'BCE': 'Computer Science Engineering',
    'BCS': 'Computer Science Engineering',
    'BEL': 'Electrical Engineering',
    'BEC': 'Electronics & Communication Engineering',
    'BME': 'Mechanical Engineering',
    'BCL': 'Civil Engineering',
    'BCH': 'Chemical Engineering',
    'BEI': 'Electronics & Instrumentation Engineering',
    'BAM': 'Artificial Intelligence & Machine Learning', // Confirmed guess, but can adjust if exact DB string differs
};

export const ADMIN_EMAIL = 'parthsavaliya1111@gmail.com';

interface StudentInfo {
    branch: string;
    admissionYear: number;
    rollNo: string;
}

export function parseStudentEmail(email: string | null | undefined): StudentInfo | null {
    if (!email) return null;

    // 1. Check for Admin Exception
    if (email === ADMIN_EMAIL) {
        return null;
    }

    // 2. Normalize and Validation
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.endsWith('@nirmauni.ac.in') && !normalizedEmail.endsWith('@nirma.ac.in')) {
        // Allow general google emails during dev/test if needed, but per requirements stick to strict parsing
        // The regex below expects the pattern at start of string, so non-matching emails will fail naturally.
        // If the user logs in with personal gmail (non-admin), we probably shouldn't redirect them aggressively 
        // unless they match the roll no pattern.
    }

    // Pattern: YYBBBB### (2 digits year, 3 letters branch, 3 digits roll)
    // Example: 24bce167 -> 24 (Year), bce (Branch), 167 (ID)
    // Regex: Start, 2 digits (Year), 3 letters (Branch), 3 digits (ID), optional rest (like @domain)
    const match = normalizedEmail.match(/^(\d{2})([a-z]{3})(\d{3})/);

    if (!match) return null;

    const [_, yearStr, branchCode, idStr] = match;
    const branchName = BRANCH_MAPPING[branchCode.toUpperCase()];

    if (!branchName) return null;

    // Convert 2-digit year to 4-digit year (Assuming 2000+)
    const admissionYear = 2000 + parseInt(yearStr, 10);

    return {
        branch: branchName,
        admissionYear: admissionYear,
        rollNo: `${yearStr}${branchCode}${idStr}`
    };
}

export function calculateSemester(admissionYear: number, currentDate: Date = new Date()): number {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12

    let semester = 0;
    const yearDiff = currentYear - admissionYear;

    if (yearDiff < 0) return 1; // Future admission year? Fallback to 1

    // Logic:
    // Admission 2024.
    // July 2024 (Sem 1) -> Diff 0, Month 7 -> (0 * 2) + 1 = 1.
    // Jan 2025 (Sem 2) -> Diff 1, Month 1 -> (1 * 2) = 2.
    // July 2025 (Sem 3) -> Diff 1, Month 7 -> (1 * 2) + 1 = 3.

    if (currentMonth >= 7) {
        // Odd Semester (July - Dec)
        semester = (yearDiff * 2) + 1;
    } else {
        // Even Semester (Jan - June)
        semester = (yearDiff * 2);
    }

    return Math.max(1, semester); // Ensure at least sem 1
}

export function getEligibleSemesters(admissionYear: number, currentDate: Date = new Date()): number[] {
    const currentSem = calculateSemester(admissionYear, currentDate);
    // Logic: A student in "2nd Year" might be in Sem 3 (Odd) or Sem 4 (Even).
    // Often web setup happens at start of year, but switching should allow viewing both sems of that academic year.
    // If calculated sem is Odd (3), Pair is [3, 4]
    // If calculated sem is Even (4), Pair is [3, 4]

    // Formula: (ceil(sem/2) * 2) - 1 gives logic.
    // Sem 1 -> Ceil(0.5)*2 - 1 = 1. Pair [1, 2]
    // Sem 2 -> Ceil(1)*2 - 1 = 1. Pair [1, 2]
    // Sem 3 -> Ceil(1.5)*2 - 1 = 3. Pair [3, 4]

    const oddSem = Math.ceil(currentSem / 2) * 2 - 1;
    return [oddSem, oddSem + 1];
}
