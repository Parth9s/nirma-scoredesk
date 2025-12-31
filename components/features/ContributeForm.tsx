'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UploadCloud, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePreferencesStore } from '@/lib/store';
import { useSession } from 'next-auth/react';
import { Progress } from '@/components/ui/progress';
import { BRANCHES } from '@/lib/constants';

interface Subject {
    id: string;
    name: string;
    semester: {
        number: number;
        branch: {
            name: string;
        }
    }
}

export function ContributeForm() {
    const { toast } = useToast();
    const { data: session } = useSession();
    // @ts-ignore
    const hasGlobalAccess = session?.user?.hasGlobalAccess || session?.user?.role === 'ADMIN';

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const { branch: storeBranch, semester: storeSemester } = usePreferencesStore();

    // Local state for Global Access overrides
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('');

    // Determine effective Branch/Sem
    const branch = hasGlobalAccess ? (selectedBranch || storeBranch) : storeBranch;
    const semester = hasGlobalAccess ? (selectedSemester ? parseInt(selectedSemester) : storeSemester) : storeSemester;

    // Fetch all subjects, then filter locally
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

    const [formData, setFormData] = useState({
        type: 'NOTE',
        subjectId: '',
        title: '',
        description: '',
        link: '',
        author: ''
    });

    useEffect(() => {
        if (hasGlobalAccess && storeBranch) {
            if (!selectedBranch) setSelectedBranch(storeBranch);
            if (!selectedSemester && storeSemester) setSelectedSemester(storeSemester.toString());
        }
    }, [hasGlobalAccess, storeBranch, storeSemester]);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await fetch('/api/subjects', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setAllSubjects(data);
                }
            } catch (e) {
                console.error('Failed to fetch subjects');
            }
        };
        fetchSubjects();
    }, []);

    // Filter subjects based on selection
    const availableSubjects = allSubjects.filter(
        s => s.semester.branch.name === branch && s.semester.number === Number(semester)
    );

    const uploadLargeFile = async (file: File, onProgress: (percent: number) => void): Promise<{ url: string, driveId: string }> => {
        // 1. Get Resumable URI
        const sessionRes = await fetch('/api/upload/session', {
            method: 'POST',
            body: JSON.stringify({ filename: file.name, type: file.type, size: file.size })
        });
        if (!sessionRes.ok) throw new Error('Failed to start upload session');
        const { uploadUri } = await sessionRes.json();

        // 2. Chunk Upload
        const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB for safety
        const totalSize = file.size;
        let offset = 0;

        while (offset < totalSize) {
            const chunk = file.slice(offset, offset + CHUNK_SIZE);
            const end = Math.min(offset + CHUNK_SIZE, totalSize);

            // Upload Chunk
            const res = await fetch(`/api/upload/chunk?uploadUri=${encodeURIComponent(uploadUri)}`, {
                method: 'PUT',
                headers: {
                    'Content-Range': `bytes ${offset}-${end - 1}/${totalSize}`
                },
                body: chunk
            });

            if (res.status === 200) {
                const data = await res.json();
                if (data.status === 'complete') {
                    onProgress(100);
                    // Fallback if webViewLink is missing
                    const driveId = data.file.id;
                    const url = data.file.webViewLink || `https://drive.google.com/file/d/${driveId}/view`;
                    return { url, driveId };
                }
            } else if (res.status !== 308) {
                // 308 is fine (Resume Incomplete), anything else is error
                throw new Error(`Upload failed at byte ${offset}`);
            }

            offset += CHUNK_SIZE;
            const percent = Math.round((offset / totalSize) * 100);
            onProgress(Math.min(percent, 99));
        }

        throw new Error('Upload finished but no file returned');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-powerpoint'
        ];

        if (!validTypes.includes(file.type)) {
            toast({ title: 'Invalid File', description: 'Allowed: PDF, Word, PPT', variant: 'destructive' });
            return;
        }

        if (file.size > 1024 * 1024 * 1024) {
            toast({ title: 'File too large', description: 'Max size is 1GB', variant: 'destructive' });
            return;
        }

        setUploading(true);
        setProgress(0);
        try {
            let result;
            if (file.size < 4 * 1024 * 1024) {
                // Standard Upload
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.details || data.error || 'Upload failed');
                result = { url: data.url, driveId: data.driveId };
                setProgress(100);
            } else {
                // Chunked Upload
                result = await uploadLargeFile(file, setProgress);
            }

            // ContributeForm stores link, not ID yet (though API supports it). 
            // Ideally we pass driveId to API too, but let's stick to link for now or update robustly.
            // Actually API supports driveId, so let's try to pass it if possible? 
            // The form state has no driveId field currently. Let's add it or just use link.
            setFormData(prev => ({ ...prev, link: result.url }));
            toast({ title: 'Uploaded', description: 'File uploaded successfully' });
        } catch (error: any) {
            console.error("Upload Error:", error);
            toast({ title: 'Error', description: error.message || 'File upload failed', variant: 'destructive' });
            setProgress(0);
        } finally {
            setUploading(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subjectId || !formData.title || !formData.link) {
            toast({ title: 'Missing Fields', description: 'Please fill all required fields', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/contributions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: formData.type,
                    subjectId: formData.subjectId,
                    title: formData.title,
                    description: formData.description,
                    url: formData.link,
                    author: formData.author || 'Anonymous Student'
                })
            });

            if (res.ok) {
                setSubmitted(true);
                setFormData({ type: 'NOTE', subjectId: '', title: '', description: '', link: '', author: '' });
                setTimeout(() => setSubmitted(false), 3000);
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to submit contribution', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Contribute Resources</h2>
                <p className="text-gray-500">
                    Help your juniors and peers by sharing notes, papers, or important topics.
                    All submissions are reviewed by admins.
                </p>
                {hasGlobalAccess && (
                    <div className="mt-2 p-2 bg-green-50 text-green-700 rounded-md text-sm inline-block border border-green-200">
                        Global Contributor Access Enabled
                    </div>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Submission Form</CardTitle>
                </CardHeader>
                <CardContent>
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center py-10 text-green-600 animate-in fade-in zoom-in duration-300">
                            <UploadCloud className="h-16 w-16 mb-4" />
                            <h3 className="text-xl font-semibold">Thank You!</h3>
                            <p>Your contribution has been submitted for review.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="author">Your Name (for credit)</Label>
                                <input
                                    id="author"
                                    type="text"
                                    placeholder="Your Name (Optional)"
                                    className="w-full rounded-md border p-2"
                                    value={formData.author}
                                    onChange={e => setFormData({ ...formData, author: e.target.value })}
                                />
                            </div>

                            {/* Branch/Sem/Subject Selection */}
                            {hasGlobalAccess && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="branch">Branch</Label>
                                        <select
                                            id="branch"
                                            className="w-full rounded-md border p-2 bg-white"
                                            value={selectedBranch}
                                            onChange={e => {
                                                setSelectedBranch(e.target.value);
                                                setFormData({ ...formData, subjectId: '' }); // Reset subject
                                            }}
                                        >
                                            <option value="">Select Branch</option>
                                            {BRANCHES.map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sem">Semester</Label>
                                        <select
                                            id="sem"
                                            className="w-full rounded-md border p-2 bg-white"
                                            value={selectedSemester}
                                            onChange={e => {
                                                setSelectedSemester(e.target.value);
                                                setFormData({ ...formData, subjectId: '' }); // Reset subject
                                            }}
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject *</Label>
                                <select
                                    id="subject"
                                    className="w-full rounded-md border p-2 bg-white"
                                    value={formData.subjectId}
                                    onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Subject ({availableSubjects.length})</option>
                                    {availableSubjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-gray-500">
                                    Showing subjects for {branch} - Sem {semester}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <input
                                    id="title"
                                    type="text"
                                    placeholder="e.g. Unit 3 Handwritten Notes"
                                    className="w-full rounded-md border p-2"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <textarea
                                    id="description"
                                    placeholder="Add a short description regarding the resource..."
                                    className="w-full rounded-md border p-2 min-h-[80px]"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Resource URL or Upload *</Label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="https://... or upload PDF"
                                        className="w-full rounded-md border p-2"
                                        value={formData.link}
                                        onChange={e => setFormData({ ...formData, link: e.target.value })}
                                        disabled={uploading}
                                    />
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />
                                        <Button variant="outline" type="button" disabled={uploading}>
                                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500">Paste a link OR upload a PDF file.</p>
                                {uploading && (
                                    <div className="space-y-1 mt-2">
                                        <Progress value={progress} className="h-2" />
                                        <p className="text-[10px] text-gray-500 text-right">{progress}% Uploaded</p>
                                    </div>
                                )}
                            </div>

                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={loading || uploading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {loading ? 'Submitting...' : 'Submit for Review'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
