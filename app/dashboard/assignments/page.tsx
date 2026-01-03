'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, User, Download, Plus, Search, Calendar, GraduationCap, X, Loader2, UploadCloud } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePreferencesStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface Assignment {
    id: string;
    title: string;
    subject: {
        name: string;
        code: string;
    };
    facultyName: string;
    studentName: string; // The "Submitted By" name
    division?: string;
    url: string;
    downloadCount: number;
    downloads?: {
        downloaderName: string;
        downloaderFaculty: string;
        downloadedAt: string;
    }[];
    createdAt: string;
}

interface Subject {
    id: string;
    name: string;
}

export default function AssignmentsPage() {
    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Peer Assignments</h1>
                    <p className="text-muted-foreground mt-2">
                        Share and find assignments from your batchmates.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Suspense fallback={null}>
                        <UploadAssignmentDialog />
                    </Suspense>
                </div>
            </div>

            <Suspense fallback={<div className="text-center py-20">Loading assignments...</div>}>
                <AssignmentList />
            </Suspense>
        </div>
    );
}

function AssignmentList() {
    const { branch, semester } = usePreferencesStore();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            let url = `/api/assignments?`;
            if (branch) url += `branch=${encodeURIComponent(branch)}&`;
            if (semester) url += `semester=${semester}`;

            const res = await fetch(url);
            if (res.ok) {
                setAssignments(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [branch, semester]);

    const filtered = assignments.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.subject.name.toLowerCase().includes(search.toLowerCase()) ||
        a.facultyName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search by topic, subject or faculty..."
                    className="pl-10 h-10 bg-white"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white border border-dashed rounded-xl text-gray-400">
                    <p>No assignments found.</p>
                    <p className="text-sm">Be the first to upload one!</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(assignment => (
                        <Card key={assignment.id} className="hover:shadow-md transition-all group border-slate-200">
                            <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                                            {assignment.subject.code}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono">
                                            {new Date(assignment.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2" title={assignment.title}>{assignment.title}</h3>
                                        <p className="text-xs text-gray-500 font-medium">{assignment.subject.name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <div>
                                            <span className="text-gray-400 block text-[10px] uppercase">Faculty</span>
                                            <span className="font-medium truncate block" title={assignment.facultyName}>{assignment.facultyName}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block text-[10px] uppercase">Uploaded By</span>
                                            <span className="font-medium truncate block" title={assignment.studentName}>{assignment.studentName}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Download History Section */}
                                {assignment.downloads && assignment.downloads.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                                        <p className="mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <User className="h-3 w-3" /> Recent Downloads
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {assignment.downloads.map((d, i) => (
                                                <span
                                                    key={i}
                                                    className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full border border-slate-200 whitespace-nowrap cursor-help transition-colors hover:bg-slate-200"
                                                    title={`Downloaded by ${d.downloaderName} (Faculty: ${d.downloaderFaculty}) on ${new Date(d.downloadedAt).toLocaleDateString()}`}
                                                >
                                                    {d.downloaderName.split(' ')[0]}
                                                </span>
                                            ))}
                                            {assignment.downloadCount > 5 && (
                                                <span className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full border border-indigo-100 font-medium">
                                                    +{assignment.downloadCount - 5} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <DownloadDialog assignment={assignment} />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
            }
        </div >
    );
}

function DownloadDialog({ assignment }: { assignment: Assignment }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [faculty, setFaculty] = useState('');
    const [error, setError] = useState('');
    const [downloadCount, setDownloadCount] = useState(assignment.downloadCount);

    const handleDownload = () => {
        // Validation Logic
        if (!name.trim() || !faculty.trim()) {
            setError('Please enter both your Name and Faculty Name.');
            return;
        }

        const enteredFaculty = faculty.trim().toLowerCase();
        const assignmentFaculty = assignment.facultyName.trim().toLowerCase();

        // Check Levenshtein distance or simple includes for robustness? 
        // User asked: "if faculty is same". Let's do strict case-insensitive match for now to be safe.
        // Actually, let's be a bit smarter. If entered faculty "Includes" assignment faculty or vice versa.
        if (enteredFaculty === assignmentFaculty || enteredFaculty.includes(assignmentFaculty) || assignmentFaculty.includes(enteredFaculty)) {
            setError('Restricted: You cannot download assignments from the same faculty to prevent copying.');
            return;
        }

        // If passed, allow download
        setError('');

        // Trigger download
        const link = document.createElement('a');
        link.href = assignment.url;
        link.download = assignment.title; // Try to suggest filename
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Close and reset
        setOpen(false);
        setName('');
        setFaculty('');

        // Optional: Update download count in DB (not critical for MVP but good)
        setDownloadCount(prev => prev + 1);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                    <Download className="mr-2 h-4 w-4" /> Download ({downloadCount})
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Download Verification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-gray-500">
                        To maintain academic integrity, please verify your details.
                    </p>

                    <div className="space-y-2">
                        <Label>Your Name</Label>
                        <Input placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Your Faculty Name</Label>
                        <Input placeholder="Who is YOUR faculty for this subject?" value={faculty} onChange={e => setFaculty(e.target.value)} />
                        <p className="text-[10px] text-gray-400">If you are in the same division/under same faculty, download is restricted.</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    <Button onClick={handleDownload} className="w-full">
                        Verify & Download
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function UploadAssignmentDialog() {
    const { branch, semester } = usePreferencesStore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const [form, setForm] = useState({
        title: '',
        subjectId: '',
        facultyName: '',
        studentName: '',
        division: '',
        url: ''
    });

    useEffect(() => {
        if (open) {
            // Fetch subjects for this branch/sem
            fetch(`/api/subjects?branch=${encodeURIComponent(branch || '')}&semester=${semester}`)
                .then(res => res.json())
                .then(data => setSubjects(data))
                .catch(e => console.error(e));
        }
    }, [open, branch, semester]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setForm(prev => ({ ...prev, url: data.url }));
            setProgress(100);
            toast({ title: 'Uploaded!', description: 'File ready.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Upload failed.', variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.title || !form.subjectId || !form.facultyName || !form.studentName || !form.url) {
            toast({ title: 'Incomplete', description: 'Please fill all required fields', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                toast({ title: 'Shared!', description: 'Your assignment is live.' });
                setOpen(false);
                setForm({ title: '', subjectId: '', facultyName: '', studentName: '', division: '', url: '' });
                // ideally refresh list here
                window.location.reload();
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Could not share assignment', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                    <Plus className="mr-2 h-4 w-4" /> Share Assignment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Share Assignment</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Topic / Title</Label>
                        <Input placeholder="e.g. Unit 3 Assignment" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Subject</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={form.subjectId}
                            onChange={e => setForm({ ...form, subjectId: e.target.value })}
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Faculty Name</Label>
                            <Input placeholder="Prof. Name" value={form.facultyName} onChange={e => setForm({ ...form, facultyName: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Your Name</Label>
                            <Input placeholder="Alias or Name" value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>File (PDF/ZIP)</Label>
                        <div className="flex gap-2">
                            <Input value={form.url} placeholder="File URL" readOnly className="bg-gray-50" />
                            <div className="relative">
                                <Input type="file" accept=".pdf,.zip,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" className="absolute opacity-0 inset-0 cursor-pointer" onChange={handleFileUpload} disabled={uploading} />
                                <Button type="button" variant="outline" size="icon">
                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={loading || uploading} className="w-full">
                    {loading ? 'Sharing...' : 'Share Now'}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
