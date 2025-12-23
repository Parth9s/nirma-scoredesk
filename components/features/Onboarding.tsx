'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePreferencesStore } from '@/lib/store';
import { parseStudentEmail, getEligibleSemesters } from '@/lib/student-utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { BRANCHES } from '@/lib/constants';

export function Onboarding() {
    const { data: session } = useSession();
    const router = useRouter();
    const { setPreferences } = usePreferencesStore();

    // State
    const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
    const [selectedSem, setSelectedSem] = useState(1);
    const [allowedSemesters, setAllowedSemesters] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);
    const [isBranchLocked, setIsBranchLocked] = useState(false);

    // Prevent hydration mismatch by mounting only on client
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Check Student Status
    useEffect(() => {
        if (session?.user?.email) {
            const studentInfo = parseStudentEmail(session.user.email);
            if (studentInfo) {
                // Lock Branch
                setSelectedBranch(studentInfo.branch);
                setIsBranchLocked(true);

                // Restrict Semesters
                const eligibleSems = getEligibleSemesters(studentInfo.admissionYear);
                setAllowedSemesters(eligibleSems);

                // Default to first eligible sem if current selection is invalid
                if (!eligibleSems.includes(selectedSem)) {
                    setSelectedSem(eligibleSems[0]);
                }
            }
        }
    }, [session, selectedSem]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPreferences(selectedBranch, selectedSem);
        router.push('/dashboard');
    };

    if (!mounted) return null;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md bg-white shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl text-center font-bold text-gray-800">
                        Welcome to Nirma ScoreDesk
                    </CardTitle>
                    <p className="text-center text-gray-500">Select your academic details to get started</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="branch">Branch</Label>
                            <select
                                id="branch"
                                className={`w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-500 focus:outline-none ${isBranchLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                disabled={isBranchLocked}
                            >
                                {BRANCHES.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                            {isBranchLocked && (
                                <p className="text-xs text-blue-600">
                                    🔒 Auto-detected from your Roll No.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="semester">Semester</Label>
                            <select
                                id="semester"
                                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-500 focus:outline-none"
                                value={selectedSem}
                                onChange={(e) => setSelectedSem(Number(e.target.value))}
                            >
                                {allowedSemesters.map(s => (
                                    <option key={s} value={s}>Semester {s}</option>
                                ))}
                            </select>
                        </div>

                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white" type="submit">
                            Get Started
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
