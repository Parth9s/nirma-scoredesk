'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BRANCHES } from '@/lib/constants';

export function AdminCalendarManager() {
    const { toast } = useToast();
    const [selectedBranch, setSelectedBranch] = useState<string>('Computer Science & Engineering');
    const [selectedSem, setSelectedSem] = useState(1);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [calendarUrl, setCalendarUrl] = useState<string | null>(null);

    // Load data
    useEffect(() => {
        fetchCalendar();
    }, [selectedBranch, selectedSem]);

    const fetchCalendar = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/calendar?branch=${encodeURIComponent(selectedBranch)}&semester=${selectedSem}`, {
                cache: 'no-store'
            });

            if (res.ok) {
                const data = await res.json();
                setCalendarUrl(data.academicCalendarUrl || null);
            } else {
                setCalendarUrl(null);
            }
        } catch (error) {
            console.error(error);
            // Don't toast on 404/initial load
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        if (file.type !== 'application/pdf') {
            toast({ title: 'Invalid File', description: 'Please upload a PDF file.', variant: 'destructive' });
            return;
        }

        setUploading(true);
        try {
            // 1. Upload File
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Upload failed');
            const { url } = await uploadRes.json();

            // 2. Save URL to Semester
            const saveRes = await fetch('/api/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    branch: selectedBranch,
                    semester: selectedSem,
                    url: url
                })
            });

            if (!saveRes.ok) throw new Error('Failed to link calendar');

            setCalendarUrl(url);
            toast({ title: 'Success', description: 'Academic Calendar uploaded successfully.' });

        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to upload calendar.', variant: 'destructive' });
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Academic Calendar</h2>
                    <p className="text-sm text-gray-500">Upload the official academic calendar PDF for student access.</p>
                </div>
            </div>

            {/* Context Selectors */}
            <div className="bg-slate-50 p-4 rounded-lg border flex gap-6 items-center flex-wrap">
                <div className="flex items-center gap-2">
                    <Label>Branch:</Label>
                    <select
                        className="border rounded p-2 bg-white"
                        value={selectedBranch}
                        onChange={e => setSelectedBranch(e.target.value)}
                    >
                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <Label>Semester:</Label>
                    <select
                        className="border rounded p-2 bg-white"
                        value={selectedSem}
                        onChange={e => setSelectedSem(Number(e.target.value))}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-gray-400" /></div>
            ) : (
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" /> Current Calendar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {calendarUrl ? (
                            <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="font-medium text-green-900">Calendar Uploaded</p>
                                        <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:underline break-all">
                                            View PDF
                                        </a>
                                    </div>
                                </div>
                                <a
                                    href={calendarUrl}
                                    download
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 rounded-md px-3 text-xs border border-green-200 bg-white text-green-700 hover:bg-green-100"
                                >
                                    Download
                                </a>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-8 text-center">
                                <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <FileText className="h-6 w-6 text-slate-400" />
                                </div>
                                <h3 className="text-sm font-medium text-slate-900">No Calendar Uploaded</h3>
                                <p className="text-xs text-slate-500 mt-1">Upload the semester schedule PDF here.</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Upload New Calendar (PDF)</Label>
                            <div className="flex items-center gap-4">
                                <label className="relative cursor-pointer w-full">
                                    <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 w-full">
                                        {uploading ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                                        ) : (
                                            <><Upload className="mr-2 h-4 w-4" /> Select PDF File</>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                        accept="application/pdf"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-gray-400">Supported format: .pdf only</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

