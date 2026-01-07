'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, User, Loader2, Calendar } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { usePreferencesStore, useCacheStore } from '@/lib/store';
import { CYCLE_A_SUBJECTS, CYCLE_B_SUBJECTS, COMMON_SUBJECTS } from '@/lib/constants';

interface Resource {
    id: string;
    title: string;
    description?: string;
    type: 'NOTE' | 'PYQ';
    url: string;
    author?: string;
    uploadedAt: string;
    subject: {
        name: string;
        semester: {
            number: number;
            branch: {
                name: string;
            }
        },
        subjectGroup?: string | null;
    };
}

import { useSearchParams } from 'next/navigation';

export function ResourceList({ type }: { type: 'NOTE' | 'PYQ' }) {
    const { branch, semester, subjectGroup } = usePreferencesStore();
    const { getCache, setCache } = useCacheStore();
    const searchParams = useSearchParams();

    // Generate cache key based on all filters
    const cacheKey = `resources-${type}-${branch || 'all'}-${semester || 'all'}-${subjectGroup || 'none'}`;

    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);

    // Initialize filter from URL param 'subject' if present
    const [filterSubject, setFilterSubject] = useState(searchParams?.get('subject') || '');
    const subjectId = searchParams?.get('subjectId');

    useEffect(() => {
        const fetchResources = async () => {
            // 1. Try Cache First for Instant Load
            const cachedData = getCache(cacheKey);
            if (cachedData) {
                setResources(cachedData);
                setLoading(false); // Immediate display
            } else {
                setLoading(true); // Show skeleton only if no cache
            }

            try {
                // Fetch resources with specific filtering
                let url = `/api/resources?type=${type}`;
                if (branch) url += `&branch=${encodeURIComponent(branch)}`;
                if (semester) url += `&semester=${semester}`;
                if (subjectGroup) url += `&subjectGroup=${subjectGroup}`;  // Optimization
                if (subjectId) url += `&subjectId=${subjectId}`;

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();

                    // Update state and cache
                    setResources(data);
                    setCache(cacheKey, data);
                }
            } catch (error) {
                console.error('Failed to fetch resources', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, [type, branch, semester, subjectGroup, cacheKey, getCache, setCache]);

    const filteredResources = resources.filter(r => {
        // 0. If filtering by specific Subject ID (Shared Mode), skip branch/sem checks
        if (subjectId) return true;

        // 1. Must match user's branch and semester
        if (branch && r.subject.semester.branch.name !== branch) return false;
        if (semester && r.subject.semester.number !== semester) return false;

        // 1.5 Filter by Group (Cycle) if applicable (FY Only)
        if (semester && semester <= 2 && subjectGroup) {
            const subjectName = r.subject.name;

            // Helper for fuzzy match (Fallback if no explicit group)
            const matches = (list: string[]) => list.some(s => subjectName.toLowerCase().includes(s.toLowerCase()));

            if (subjectGroup === '1') {
                // Cycle A + Common (Physics Cycle)
                // 1. Explicit Check
                if (r.subject.subjectGroup === '1' || r.subject.subjectGroup === 'COMMON') return true;
                if (r.subject.subjectGroup === '2') return false; // Explicitly belongs to other group

                // 2. Fallback Check (Name matching)
                if (!matches(CYCLE_A_SUBJECTS) && !matches(COMMON_SUBJECTS)) return false;
            } else if (subjectGroup === '2') {
                // Cycle B + Common (Chemistry/IWP Cycle)

                if (r.subject.subjectGroup === '2' || r.subject.subjectGroup === 'COMMON') return true;
                if (r.subject.subjectGroup === '1') return false;

                if (!matches(CYCLE_B_SUBJECTS) && !matches(COMMON_SUBJECTS)) return false;
            }
        }

        // 2. Must match search filter (if any)
        if (filterSubject && !r.subject.name.toLowerCase().includes(filterSubject.toLowerCase()) && !r.title.toLowerCase().includes(filterSubject.toLowerCase())) {
            return false;
        }

        return true;
    });

    // Group by Subject
    const groupedResources = filteredResources.reduce((acc, res) => {
        const subName = res.subject.name;
        if (!acc[subName]) acc[subName] = [];
        acc[subName].push(res);
        return acc;
    }, {} as Record<string, Resource[]>);

    const sortedSubjectNames = Object.keys(groupedResources).sort();

    // Replace Spinner with Skeleton Grid
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">{type === 'NOTE' ? 'Study Notes' : 'Previous Year Questions'}</h2>
                    <p className="text-sm text-gray-500">
                        Showing resources for {branch || 'All Branches'} - Sem {semester || 'All'}
                    </p>
                </div>
                <input
                    type="text"
                    placeholder="Search by Subject or Title..."
                    className="rounded-md border px-3 py-2 text-sm w-full md:w-64"
                    value={filterSubject}
                    onChange={e => setFilterSubject(e.target.value)}
                />
            </div>

            <div className="space-y-8">
                {filteredResources.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                        No resources found for your semester.
                        <br />
                        <span className="text-sm">Be the first to contribute!</span>
                    </div>
                ) : (
                    sortedSubjectNames.map(subjectName => (
                        <div key={subjectName} className="space-y-3">
                            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-slate-600" />
                                {subjectName}
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {groupedResources[subjectName].sort((a, b) => {
                                    return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
                                }).map(res => (
                                    <Card key={res.id} className="hover:shadow-md transition-shadow group h-full">
                                        <CardContent className="p-4 flex flex-col justify-between h-full gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-full">
                                                    <h3 className="font-semibold text-gray-900 line-clamp-2" title={res.title}>{res.title}</h3>
                                                    {res.description && (
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2" title={res.description}>
                                                            {res.description}
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-2 border-t pt-2">
                                                        {res.author && (
                                                            <span className="flex items-center gap-1 text-xs">
                                                                <User className="h-3 w-3" /> {res.author}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(res.uploadedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2">
                                                <Button size="sm" variant="outline" className="w-full gap-2 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300" asChild>
                                                    <a href={res.url} target="_blank" rel="noreferrer">
                                                        <Download className="h-4 w-4" /> Download
                                                    </a>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
