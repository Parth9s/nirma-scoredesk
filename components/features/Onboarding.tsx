'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePreferencesStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { BRANCHES } from '@/lib/constants';

export function Onboarding() {
    const router = useRouter();
    const { setPreferences } = usePreferencesStore();
    const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
    const [selectedSem, setSelectedSem] = useState(1);

    // Prevent hydration mismatch by mounting only on client
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

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
                                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-500 focus:outline-none"
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                            >
                                {BRANCHES.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="semester">Semester</Label>
                            <select
                                id="semester"
                                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-500 focus:outline-none"
                                value={selectedSem}
                                onChange={(e) => setSelectedSem(Number(e.target.value))}
                            >
                                {[1, 2, 3, 4].map(s => (
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
