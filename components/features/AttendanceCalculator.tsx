'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Calculator, FlaskConical, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from "@/components/ui/switch";

export function AttendanceCalculator() {
    const [lecture, setLecture] = useState({ total: 0, attended: 0 });
    const [lab, setLab] = useState({ total: 0, attended: 0 });
    const [hasLab, setHasLab] = useState(true);
    const [targetPercentage, setTargetPercentage] = useState(85);

    // Helper to generic calculation
    const calculateStats = (attended: number, total: number) => {
        if (total === 0) return { attended, total, percentage: 0 };
        // Ceiling function as requested
        const percentage = Math.ceil((attended / total) * 100);
        return { attended, total, percentage };
    };

    const lectureStats = calculateStats(lecture.attended, lecture.total);
    const labStats = calculateStats(lab.attended, lab.total);

    // Overall Calculation (Average of percentages)
    const overallPercentage = useMemo(() => {
        if (!hasLab) return lectureStats.percentage;
        // Average of the two percentages, also ceiled? User said "my avg attandance... is 95%" from 90 and 100.
        // (90 + 100) / 2 = 95.
        // If 90.5 (which is 91) and 100.
        // (91 + 100) / 2 = 95.5 -> ceil -> 96?
        // Let's ceil the final result too.
        return Math.ceil((lectureStats.percentage + labStats.percentage) / 2);
    }, [lectureStats, labStats, hasLab]);

    const getRecommendation = (
        stats: { percentage: number, attended: number, total: number },
        target: number,
        type: 'Lecture' | 'Lab' | 'Overall'
    ) => {
        if (stats.percentage >= target) {
            // Can Bunk
            const bunks = Math.floor((stats.attended * 100 - target * stats.total) / target);
            if (bunks <= 0) return { type: 'neutral', msg: 'Maintain attendance.' };

            let msg = `You can bunk ${bunks} ${type}${bunks > 1 ? 's' : ''} safely.`;

            // Equivalency Logic: 2 Lectures = 1 Lab
            if (type === 'Lecture' && bunks >= 2) {
                const labs = Math.floor(bunks / 2);
                msg = `You can bunk ${bunks} Lectures / ${labs} Lab${labs > 1 ? 's' : ''} safely.`;
            } else if (type === 'Lab' && bunks >= 1) {
                const lectures = bunks * 2;
                msg = `You can bunk ${bunks} Lab${bunks > 1 ? 's' : ''} / ${lectures} Lectures safely.`;
            }

            return { type: 'success', msg };
        } else {
            // Must Attend
            const needed = Math.ceil(((target * stats.total) - (100 * stats.attended)) / (100 - target));
            if (needed <= 0) return { type: 'neutral', msg: 'On track.' };
            return { type: 'danger', msg: `Attend next ${needed} ${type}${needed > 1 ? 's' : ''} to reach ${target}%.` };
        }
    };

    const lectureRec = getRecommendation(lectureStats, targetPercentage, 'Lecture');
    const labRec = getRecommendation(labStats, targetPercentage, 'Lab');

    // Overall Recommendation is tricky because we have two variables.
    // It's ambiguous "how many to attend" for overall average.
    // Just show the status? Or assume user wants to attend both?
    // Let's show a generic status for overall.
    const overallStatus = overallPercentage >= targetPercentage ? 'Safe' : 'Critical';

    return (
        <Card className="max-w-3xl mx-auto shadow-md border-slate-200">
            <CardHeader className="bg-slate-50/50 pb-4 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-blue-600" />
                        Generic Attendance Calculator
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Label className="text-sm">Target %</Label>
                        <input
                            type="number"
                            className="w-16 rounded border-gray-300 p-1 text-sm md:text-base text-center font-bold"
                            value={targetPercentage}
                            onChange={e => setTargetPercentage(Math.max(1, Math.min(100, Number(e.target.value))))}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">

                {/* 1. LECTURE SECTION */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold text-lg text-slate-700">
                            <BookOpen className="w-5 h-5" /> Lecture
                        </div>
                        <div className={`text-xl font-bold ${lectureStats.percentage >= targetPercentage ? 'text-green-600' : 'text-red-600'}`}>
                            {lectureStats.percentage}%
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-gray-500 uppercase tracking-wider">Total Lect.</Label>
                            <input
                                type="number"
                                min="0"
                                className="w-full mt-1 rounded-md border-gray-200 bg-gray-50 p-2.5 text-lg font-medium shadow-sm transition-all focus:border-blue-500 focus:ring-blue-500"
                                value={lecture.total || ''}
                                onChange={e => setLecture(p => ({ ...p, total: Number(e.target.value) }))}
                                placeholder="Total"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-gray-500 uppercase tracking-wider">Attended</Label>
                            <input
                                type="number"
                                min="0"
                                className="w-full mt-1 rounded-md border-gray-200 bg-white p-2.5 text-lg font-medium shadow-sm transition-all focus:border-green-500 focus:ring-green-500"
                                value={lecture.attended || ''}
                                onChange={e => setLecture(p => ({ ...p, attended: Number(e.target.value) }))}
                                placeholder="Attended"
                            />
                        </div>
                    </div>

                    {/* Recommendation Message */}
                    <div className={`rounded-lg p-3 text-sm flex items-start gap-3 ${lectureRec.type === 'success' ? 'bg-green-50 text-green-800' :
                        lectureRec.type === 'danger' ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'
                        }`}>
                        {lectureRec.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                        <span className="font-medium mt-0.5">{lectureRec.msg}</span>
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* 2. LAB SECTION */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold text-lg text-slate-700">
                            <FlaskConical className="w-5 h-5" />
                            <span>Lab / Tutorial</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Switch checked={hasLab} onCheckedChange={setHasLab} id="lab-mode" />
                                <Label htmlFor="lab-mode" className="cursor-pointer">Enable</Label>
                            </div>
                            {hasLab && (
                                <div className={`text-xl font-bold ${labStats.percentage >= targetPercentage ? 'text-green-600' : 'text-red-600'}`}>
                                    {labStats.percentage}%
                                </div>
                            )}
                        </div>
                    </div>

                    {hasLab && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label className="text-xs text-gray-500 uppercase tracking-wider">Total Lab</Label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full mt-1 rounded-md border-gray-200 bg-gray-50 p-2.5 text-lg font-medium shadow-sm transition-all focus:border-blue-500 focus:ring-blue-500"
                                        value={lab.total || ''}
                                        onChange={e => setLab(p => ({ ...p, total: Number(e.target.value) }))}
                                        placeholder="Total"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500 uppercase tracking-wider">Attended</Label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full mt-1 rounded-md border-gray-200 bg-white p-2.5 text-lg font-medium shadow-sm transition-all focus:border-green-500 focus:ring-green-500"
                                        value={lab.attended || ''}
                                        onChange={e => setLab(p => ({ ...p, attended: Number(e.target.value) }))}
                                        placeholder="Attended"
                                    />
                                </div>
                            </div>
                            <div className={`rounded-lg p-3 text-sm flex items-start gap-3 ${labRec.type === 'success' ? 'bg-green-50 text-green-800' :
                                labRec.type === 'danger' ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'
                                }`}>
                                {labRec.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                                <span className="font-medium mt-0.5">{labRec.msg}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-px bg-slate-100" />

                {/* 3. OVERALL SUMMARY */}
                <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col items-center text-center space-y-2">
                    <h3 className="text-slate-400 font-medium uppercase tracking-widest text-xs">Overall Attendance</h3>
                    <div className={`text-5xl font-bold ${overallPercentage >= targetPercentage ? 'text-green-400' : 'text-red-400'}`}>
                        {overallPercentage}%
                    </div>
                    <p className="text-slate-400 text-sm">
                        {hasLab ? '(Average of Lecture & Lab)' : '(Lecture Only)'}
                    </p>
                    {overallPercentage < targetPercentage && (
                        <div className="mt-2 text-red-300 text-sm font-medium animate-pulse">
                            Warning: Short Attention Needed!
                        </div>
                    )}
                    {overallPercentage >= targetPercentage && overallPercentage < 100 && (
                        <div className="mt-2 text-green-300 text-sm font-medium">
                            You are safe!
                        </div>
                    )}
                </div>

            </CardContent>
        </Card>
    );
}

