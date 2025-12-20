'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { usePreferencesStore } from '@/lib/store';
import { useAdminStore } from '@/lib/admin-store';

// Grade Mapping based on Table 1
// O=10, A+=9, A=8, B+=7, B=6, C=5, P=4, F=0/Ab=0
const GRADE_POINTS: Record<string, number> = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'P': 4,
    'F': 0,
    'Ab': 0
};

const getGrade = (percentage: number) => {
    // Round to nearest integer to match table strictness? 
    // Table says "91 and above". 90.9 is not 91. 
    // Usually standard rounding applies in absence of explicit float policies.
    // However, safer to treat strict >=.
    if (percentage >= 91) return 'O';
    if (percentage >= 81) return 'A+';
    if (percentage >= 71) return 'A';
    if (percentage >= 61) return 'B+';
    if (percentage >= 51) return 'B';
    if (percentage >= 46) return 'C';
    if (percentage >= 40) return 'P'; // 40 to 45
    return 'F';
};

export function GradeCalculator() {
    const { branch, semester } = usePreferencesStore();
    const { subjects, fetchSubjects } = useAdminStore();

    useEffect(() => {
        fetchSubjects();
    }, []);

    // Filter relevant subjects (and exclude 0 credit subjects)
    const mySubjects = subjects.filter(s =>
        s.branch === branch &&
        s.semester === semester &&
        s.credits > 0 // User Request: Remove 0 credit subjects from SGPA Calc
    );

    // Store user inputs: subjectId -> componentIndex -> marks Scored
    const [marks, setMarks] = useState<Record<string, Record<number, number>>>({});

    const handleMarkChange = (subId: string, compIdx: number, val: number) => {
        setMarks(prev => ({
            ...prev,
            [subId]: {
                ...(prev[subId] || {}),
                [compIdx]: val
            }
        }));
    };

    const calculateSubjectScore = (sub: typeof mySubjects[0]) => {
        let totalWeightedScore = 0;

        sub.components.forEach((comp, idx) => {
            const scored = marks[sub.id]?.[idx] || 0;
            // Calculate percentage contribution of this component
            // If component weight is 30% and max marks is 50. Scored 40.
            // (40/50) * 30 = 24 contribution.
            const contribution = (scored / comp.maxMarks) * comp.weight;
            totalWeightedScore += contribution;
        });

        const grade = getGrade(totalWeightedScore);
        const point = GRADE_POINTS[grade] ?? 0;

        return { score: totalWeightedScore, grade, point };
    };

    const calculateSGPA = () => {
        let totalWeightedPoints = 0;
        let totalCredits = 0;

        mySubjects.forEach(sub => {
            const { point } = calculateSubjectScore(sub);
            // SGPA (Si) = Σ(Ci x Gi) / ΣCi
            totalWeightedPoints += sub.credits * point;
            totalCredits += sub.credits;
        });

        return totalCredits === 0 ? '0.00' : (totalWeightedPoints / totalCredits).toFixed(2);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">SGPA Calculator</h2>
                    <p className="text-sm text-gray-500">Based on {branch} Sem {semester} Curriculum</p>
                </div>
                <Card className="bg-slate-700 text-white w-48">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                        <span className="text-sm font-medium opacity-90">Projected SGPA</span>
                        <span className="text-3xl font-bold">{calculateSGPA()}</span>
                    </CardContent>
                </Card>
            </div>

            {mySubjects.length === 0 && (
                <div className="text-center py-12 bg-gray-50 border border-dashed rounded-lg text-gray-400">
                    No subjects found. Please ask Admin to configure subjects for {branch} - Sem {semester}.
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {mySubjects.map(sub => {
                    const { score, grade, point } = calculateSubjectScore(sub);

                    return (
                        <Card key={sub.id}>
                            <CardHeader className="bg-gray-50 pb-2 border-b">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">{sub.name}</CardTitle>
                                        <div className="text-xs text-gray-500">Credits: {sub.credits}</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="inline-flex h-10 px-3 items-center justify-center rounded bg-slate-100 text-slate-900 font-bold text-lg border border-slate-200">
                                            {grade} <span className="ml-1 text-sm font-normal text-slate-600">({point})</span>
                                        </span>
                                        <span className="text-xs text-slate-400 mt-1">
                                            {score.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {sub.components.map((comp, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="w-24 text-sm font-medium text-gray-600">
                                            {comp.type} <span className="text-xs text-gray-400">({comp.weight}%)</span>
                                        </div>
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max={comp.maxMarks}
                                                className="w-full rounded border p-1 text-sm"
                                                placeholder={`Max ${comp.maxMarks}`}
                                                value={marks[sub.id]?.[idx] ?? ''}
                                                onChange={e => handleMarkChange(sub.id, idx, Number(e.target.value))}
                                            />
                                            <span className="text-xs text-gray-400 w-12 text-right">/ {comp.maxMarks}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
