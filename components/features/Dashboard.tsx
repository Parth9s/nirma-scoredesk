'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePreferencesStore } from '@/lib/store';
import { useAdminStore } from '@/lib/admin-store';
import { parseStudentEmail, calculateSemester, getEligibleSemesters } from '@/lib/student-utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, GraduationCap, ArrowRight, MousePointerClick } from 'lucide-react';
import { AdBanner } from '@/components/ui/AdBanner';
import { FeatureLinkCard } from './FeatureLinkCard';
import { SubjectModal } from './SubjectModal';

export function Dashboard() {
    const { data: session } = useSession();
    const { branch, semester, resetPreferences, setPreferences } = usePreferencesStore();
    const { subjects, calendarUrls, fetchSubjects, fetchCalendarUrl } = useAdminStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchSubjects();
    }, []);

    // Automatic Branch/Sem Detection
    // Automatic Branch/Sem Detection
    useEffect(() => {
        if (session?.user?.email) {
            const studentInfo = parseStudentEmail(session.user.email);
            if (studentInfo) {
                const currentSem = calculateSemester(studentInfo.admissionYear);
                const eligibleSems = getEligibleSemesters(studentInfo.admissionYear);

                // 1. Strict Branch Enforcement
                if (branch !== studentInfo.branch) {
                    console.log(`Auto-redirecting student branch to ${studentInfo.branch}`);
                    setPreferences(studentInfo.branch, currentSem);
                    return;
                }

                // 2. Allow switching between eligible semesters (e.g., Sem 3 & 4)
                // Only redirect if the current semester is NOT in the eligible list
                if (!semester || !eligibleSems.includes(semester)) {
                    console.log(`Auto-redirecting student sem to ${currentSem} (Current: ${semester} not in [${eligibleSems}])`);
                    setPreferences(studentInfo.branch, currentSem);
                }
            }
        }
    }, [session, branch, semester, setPreferences]);

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

    // State for Subject Command Center Modal
    const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSubjectClick = (subject: any) => {
        setSelectedSubject(subject);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen">
            {/* Subject Command Center Modal */}
            <SubjectModal
                subject={selectedSubject}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            <header className="border-b sticky top-0 z-50 backdrop-blur-sm bg-white/50">
                <div className="h-16 px-6 flex items-center justify-between">
                    <div className="flex-1" /> {/* Spacer to push content to right */}
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600 hidden sm:block">
                            {mounted ? `${branch || 'Select Branch'} • Sem ${semester || '-'}` : 'Loading...'}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/setup">
                                Switch
                            </Link>
                        </Button>
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
                            borderColorClass="border-l-blue-500"
                            iconBgClass="bg-blue-100"
                            iconColorClass="text-blue-600"
                            buttonText="Calculate"
                        />
                        <FeatureLinkCard
                            title="Attendance Tracker"
                            description="Check your safe bunks. Maintain 85% attendance requirement."
                            icon={Calendar}
                            href="/dashboard/attendance"
                            borderColorClass="border-l-green-500"
                            iconBgClass="bg-green-100"
                            iconColorClass="text-green-600"
                            buttonText="Track"
                        />
                        <FeatureLinkCard
                            title="Notes"
                            description="Access lecture notes and study material."
                            icon={BookOpen}
                            href="/dashboard/resources/notes"
                            borderColorClass="border-l-purple-500"
                            iconBgClass="bg-purple-100"
                            iconColorClass="text-purple-600"
                            buttonText="View Notes"
                        />
                        <FeatureLinkCard
                            title="Peer Assignments"
                            description="Share and copy assignments from batchmates."
                            icon={BookOpen}
                            href="/dashboard/assignments"
                            borderColorClass="border-l-orange-500"
                            iconBgClass="bg-orange-100"
                            iconColorClass="text-orange-600"
                            buttonText="Browse"
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 2. Your Subjects (Main Column) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Your Subjects</h3>
                        </div>

                        {mySubjects.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {mySubjects.map(sub => (
                                    <div
                                        key={sub.id}
                                        className="bg-white p-4 rounded-xl border transition-all group relative hover:shadow-md cursor-pointer hover:border-indigo-200 active:scale-[0.98]"
                                        onClick={() => handleSubjectClick(sub)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-gray-800 pr-6 leading-tight group-hover:text-indigo-700 transition-colors">{sub.name}</h4>
                                            <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded group-hover:bg-indigo-50 group-hover:text-indigo-600">{sub.code}</span>
                                        </div>
                                        <div className="flex gap-2 text-xs text-gray-500 mb-3">
                                            <span>{sub.credits} Credits</span>
                                            <span>•</span>
                                            <span>{sub.components.length} Components</span>
                                        </div>
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MousePointerClick className="h-4 w-4 text-indigo-400" />
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
                                    <Calendar className="h-4 w-4" /> Academic Activity Calendar
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
                                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 px-3 text-xs w-full bg-indigo-600 text-white hover:bg-indigo-700"
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


                    </div>
                </div>
            </main>
        </div>
    );
}
