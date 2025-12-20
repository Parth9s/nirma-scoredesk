'use client';

import { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Calculator, FlaskConical, BookOpen, Upload, FileText, Check, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseMISReport, AttendanceRecord } from '@/lib/mis-parser';

export function AttendanceCalculator() {
    // Mode: 'generic' (default) or 'imported' (list)
    const [importedData, setImportedData] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generic Calculator State (Legacy)
    const [lecture, setLecture] = useState({ total: 0, attended: 0 });
    const [lab, setLab] = useState({ total: 0, attended: 0 });
    const [hasLab, setHasLab] = useState(true);
    const [targetPercentage, setTargetPercentage] = useState(85);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            const records = await parseMISReport(file);
            if (records.length === 0) {
                setError("No attendance data found. Please ensure it's a valid MIS Report (PDF or HTML).");
            } else {
                setImportedData(records);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to parse file. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const clearImport = () => {
        setImportedData([]);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Helper to generic calculation
    const calculateStats = (attended: number, total: number) => {
        if (total === 0) return { attended, total, percentage: 0 };
        const percentage = Math.ceil((attended / total) * 100);
        return { attended, total, percentage };
    };

    const lectureStats = calculateStats(lecture.attended, lecture.total);
    const labStats = calculateStats(lab.attended, lab.total);

    // Overall Calculation (Generic Mode)
    // defined unconditionally
    const overallPercentage = useMemo(() => {
        if (!hasLab) return lectureStats.percentage;
        return Math.ceil((lectureStats.percentage + labStats.percentage) / 2);
    }, [lectureStats, labStats, hasLab]);

    const getRecommendation = (
        stats: { percentage: number, attended: number, total: number },
        target: number,
        type: 'Lecture' | 'Lab' | 'Overall'
    ) => {
        if (stats.percentage >= target) {
            const bunks = Math.floor((stats.attended * 100 - target * stats.total) / target);
            if (bunks <= 0) return { type: 'neutral', msg: 'Maintain.' };

            let msg = `Safe to bunk ${bunks} ${type}${bunks > 1 ? 's' : ''}.`;

            // Equivalency Logic: 2 Lectures = 1 Lab
            if (type === 'Lecture' && bunks >= 2) {
                const labs = Math.floor(bunks / 2);
                msg = `Safe to bunk ${bunks} Lectures / ${labs} Lab${labs > 1 ? 's' : ''}.`;
            } else if (type === 'Lab' && bunks >= 1) {
                const lectures = bunks * 2;
                msg = `Safe to bunk ${bunks} Lab${bunks > 1 ? 's' : ''} / ${lectures} Lectures.`;
            }

            return { type: 'success', msg };
        } else {
            const needed = Math.ceil(((target * stats.total) - (100 * stats.attended)) / (100 - target));
            if (needed <= 0) return { type: 'neutral', msg: 'On track.' };
            return { type: 'danger', msg: `Attend ${needed} ${type}${needed > 1 ? 's' : ''}.` };
        }
    };

    const lectureRec = getRecommendation(lectureStats, targetPercentage, 'Lecture');
    const labRec = getRecommendation(labStats, targetPercentage, 'Lab');

    // Render logic for a single card (used in list)
    const AttendanceCard = ({ record }: { record: AttendanceRecord }) => {
        const stats = calculateStats(record.attended, record.total);

        // Map Tutorial to Lab for recommendation logic as requested ("1 lab/tutorial = 2 lecture")
        let recType: 'Lecture' | 'Lab' | 'Overall' = 'Overall';
        if (record.type === 'Lecture') recType = 'Lecture';
        else if (record.type === 'Lab' || record.type === 'Tutorial') recType = 'Lab';

        const rec = getRecommendation(stats, targetPercentage, recType);

        return (
            <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="font-semibold text-gray-800">{record.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{record.code} • {record.type}</div>
                    </div>
                    <div className={`text-xl font-bold ${stats.percentage >= targetPercentage ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.percentage}%
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div>
                        <span className="font-bold text-gray-900">{record.attended}</span>
                        <span className="text-gray-400"> / {record.total}</span>
                        <span className="text-xs text-gray-400 ml-1">Attended</span>
                    </div>
                </div>

                <div className={`rounded px-2.5 py-1.5 text-xs font-medium flex items-center gap-2 ${rec.type === 'success' ? 'bg-green-50 text-green-700' :
                    rec.type === 'danger' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {rec.type === 'success' ? <CheckCircle className="w-3 h-3" /> :
                        rec.type === 'danger' ? <AlertCircle className="w-3 h-3" /> : null}
                    {rec.msg}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Attendance Tracker</h1>
                <p className="text-gray-500">
                    Calculate your safe bunks or import your entire attendance report.
                </p>
            </div>

            <Tabs defaultValue="single" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
                    <TabsTrigger value="single" className="text-base gap-2">
                        <Calculator className="w-4 h-4" /> One Subject
                    </TabsTrigger>
                    <TabsTrigger value="import" className="text-base gap-2">
                        <FileText className="w-4 h-4" /> All Subjects (Import)
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: SINGLE SUBJECT */}
                <TabsContent value="single">
                    <Card className="shadow-md border-slate-200">
                        <CardHeader className="bg-slate-50/50 pb-4 border-b">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle>Single Subject Calculator</CardTitle>
                                    <CardDescription>
                                        Enter details for one subject to check bunks.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2 border-l pl-3 ml-1">
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
                                        Warning: Attendance Shortage!
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
                </TabsContent>

                {/* TAB 2: IMPORT IMPORT */}
                <TabsContent value="import" className="space-y-6">
                    {/* Upload Card */}
                    {importedData.length === 0 && (
                        <>
                            <Card className="border-dashed border-2">
                                <CardContent className="pt-6 flex flex-col items-center justify-center py-12 text-center space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-full">
                                        <Upload className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-lg">Upload MIS Report</h3>
                                        <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                            Drag and drop your MIS Attendance PDF or HTML file here to instantly calculate stats for all subjects.
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pdf,.html,.htm"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            disabled={isLoading}
                                        />
                                        <Button disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                                            {isLoading ? 'Processing...' : 'Select File'}
                                        </Button>
                                    </div>
                                    {error && (
                                        <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> {error}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Instructions Guide */}
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6">
                                <h4 className="flex items-center gap-2 font-semibold text-blue-900 mb-4">
                                    <Info className="w-5 h-5 text-blue-600" />
                                    How to get your Attendance Report?
                                </h4>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 marker:text-blue-500 marker:font-bold">
                                        <li>Login to your <strong>MIS</strong>.</li>
                                        <li>Generate your <span className="font-medium text-slate-900">Attendance Report</span>.</li>
                                        
                                    </ol>
                                    <div className="space-y-2 text-sm text-slate-600">
                                        <p><strong>To save as PDF:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-xs">Ctrl + P</kbd> and choose "Save as PDF".</p>
                                        <p><strong>To save as HTML:</strong> Right-click &gt; "Save As..." &gt; "Webpage, Complete".</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Results View */}
                    {importedData.length > 0 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Header Summary */}
                            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <FileText className="w-6 h-6 text-blue-400" />
                                        Attendance Report
                                    </h2>
                                    <p className="text-slate-400 text-sm mt-1">
                                        Found {importedData.length} subjects from your PDF.
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700">
                                        <Label className="text-slate-300 text-xs uppercase tracking-wider">Target %</Label>
                                        <input
                                            type="number"
                                            className="w-12 bg-transparent text-white font-bold text-center border-none focus:ring-0 p-0"
                                            value={targetPercentage}
                                            onChange={e => setTargetPercentage(Math.max(1, Math.min(100, Number(e.target.value))))}
                                        />
                                    </div>
                                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800" onClick={clearImport}>
                                        <X className="w-4 h-4 mr-2" /> Clear & Upload New
                                    </Button>
                                </div>
                            </div>

                            {/* Categorized Sections */}
                            {(() => {
                                const criticalSubjects = importedData.filter(record => {
                                    const stats = calculateStats(record.attended, record.total);
                                    let recType: 'Lecture' | 'Lab' | 'Overall' = 'Overall';
                                    if (record.type === 'Lecture') recType = 'Lecture';
                                    else if (record.type === 'Lab' || record.type === 'Tutorial') recType = 'Lab';
                                    return getRecommendation(stats, targetPercentage, recType).type === 'danger';
                                });

                                const safeSubjects = importedData.filter(record => {
                                    const stats = calculateStats(record.attended, record.total);
                                    let recType: 'Lecture' | 'Lab' | 'Overall' = 'Overall';
                                    if (record.type === 'Lecture') recType = 'Lecture';
                                    else if (record.type === 'Lab' || record.type === 'Tutorial') recType = 'Lab';
                                    return getRecommendation(stats, targetPercentage, recType).type === 'success';
                                });

                                const maintainSubjects = importedData.filter(record => {
                                    const stats = calculateStats(record.attended, record.total);
                                    let recType: 'Lecture' | 'Lab' | 'Overall' = 'Overall';
                                    if (record.type === 'Lecture') recType = 'Lecture';
                                    else if (record.type === 'Lab' || record.type === 'Tutorial') recType = 'Lab';
                                    return getRecommendation(stats, targetPercentage, recType).type === 'neutral';
                                });

                                return (
                                    <div className="space-y-8">
                                        {/* 1. Critical Section */}
                                        {criticalSubjects.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                                                    <AlertCircle className="w-5 h-5" />
                                                    Critical Attention Needed ({criticalSubjects.length})
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {criticalSubjects.map((record, i) => (
                                                        <AttendanceCard key={`crit-${i}`} record={record} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 2. Safe Section */}
                                        {safeSubjects.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="text-xl font-bold text-green-600 flex items-center gap-2">
                                                    <CheckCircle className="w-5 h-5" />
                                                    Safe to Bunk ({safeSubjects.length})
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {safeSubjects.map((record, i) => (
                                                        <AttendanceCard key={`safe-${i}`} record={record} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 3. Maintain Section */}
                                        {maintainSubjects.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="text-xl font-bold text-gray-600 flex items-center gap-2">
                                                    <Check className="w-5 h-5" />
                                                    Maintain Status ({maintainSubjects.length})
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {maintainSubjects.map((record, i) => (
                                                        <AttendanceCard key={`maint-${i}`} record={record} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

