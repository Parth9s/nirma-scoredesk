'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePreferencesStore } from '@/lib/store';
import { useAdminStore } from '@/lib/admin-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, GraduationCap, ArrowRight, MousePointerClick } from 'lucide-react';
import { AdBanner } from '@/components/ui/AdBanner';
import { FeatureLinkCard } from './FeatureLinkCard';

export function Dashboard() {
    const { branch, semester, resetPreferences } = usePreferencesStore();
    const { subjects, calendarUrls, fetchSubjects, fetchCalendarUrl } = useAdminStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchSubjects();
    }, []);

    // Filter subjects based on user preference
    const mySubjects = subjects.filter(s =>
        s.branch === branch && s.semester === semester
    );

    // Fetch Calendar on Branch/Sem change
    useEffect(() => {
        if (branch && semester) {
            fetchCalendarUrl(branch, semester);
        }
    }, [branch, semester]);

    const calendarUrl = (branch && semester && calendarUrls[branch]?.[semester]) || null;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center">
                        {/* Title removed */}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600 hidden sm:block">
                            {mounted ? `${branch || 'Select Branch'} • Sem ${semester || '-'}` : 'Loading...'}
                        </div>
                        <Link href="/setup">
                            <Button variant="outline" size="sm">
                                Switch
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

                {/* Top Ad Banner */}
                <AdBanner className="mb-8" />

                {/* 1. Welcome & Tools Section */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">Academic Tools</h2>
                        <p className="text-gray-500 mt-1">Manage your grades, attendance, and resources.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FeatureLinkCard
                            title="Grade Calculator"
                            description="Plan your target SGPA. Calculate score based on internal components."
                            icon={GraduationCap}
                            href="/dashboard/sgpa"
                            colorClass="border-l-blue-500"
                            buttonText="Calculate"
                        />
                        <FeatureLinkCard
                            title="Attendance Tracker"
                            description="Check your safe bunks. Maintain 85% attendance requirement."
                            icon={Calendar}
                            href="/dashboard/attendance"
                            colorClass="border-l-green-500"
                            buttonText="Track"
                        />
                        <FeatureLinkCard
                            title="Notes"
                            description="Access lecture notes and study material."
                            icon={BookOpen}
                            href="/dashboard/resources/notes"
                            colorClass="border-l-purple-500"
                            buttonText="View Notes"
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 2. Your Subjects (Main Column) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Your Subjects</h3>
                            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                                {mySubjects.length} Found
                            </span>
                        </div>

                        {mySubjects.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {mySubjects.map(sub => (
                                    <div key={sub.id} className="bg-white p-4 rounded-xl border transition-colors group relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-gray-800 pr-6 leading-tight">{sub.name}</h4>
                                            <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{sub.code}</span>
                                        </div>
                                        <div className="flex gap-2 text-xs text-gray-500 mb-3">
                                            <span>{sub.credits} Credits</span>
                                            <span>•</span>
                                            <span>{sub.components.length} Components</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white border border-dashed rounded-xl text-gray-400">
                                <p>No subjects configured yet.</p>
                                <p className="text-sm mt-1">Select a different branch/sem or ask Admin.</p>
                            </div>
                        )}
                    </div>

                    {/* 3. Sidebar: Utilities & Calendar */}
                    <div className="space-y-6">
                        {/* Academic Calendar Download Card */}
                        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-indigo-900 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Academic Calendar
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {calendarUrl ? (
                                    <div className="space-y-4">
                                        <div className="text-xs text-indigo-700 bg-indigo-100/50 p-2 rounded">
                                            Official academic schedule is available.
                                        </div>
                                        <a
                                            href={calendarUrl}
                                            download
                                            target="_blank"
                                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 rounded-md px-3 text-xs w-full bg-indigo-600 text-white hover:bg-indigo-700 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                                        >
                                            Download PDF
                                        </a>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-400 italic">No calendar uploaded yet.</p>
                                        <Button variant="outline" size="sm" className="w-full" disabled>
                                            Download Unavailable
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Tips */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <h4 className="font-bold text-yellow-800 text-sm mb-2">💡 Pro Tip</h4>
                            <p className="text-xs text-yellow-700 leading-relaxed">
                                Use the <strong>Attendance Tracker</strong> to mark your "Safe Bunks".
                                The system alerts you if you drop below 85%.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
