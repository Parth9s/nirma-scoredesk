'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UploadCloud, Upload, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePreferencesStore } from '@/lib/store';

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

import { BRANCHES } from '@/lib/constants';

export function ContributeForm() {
    const { toast } = useToast();
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const { branch, semester } = usePreferencesStore();

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
        s => s.semester.branch.name === branch && s.semester.number === semester
    );

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast({ title: 'Invalid File', description: 'Please upload a PDF', variant: 'destructive' });
            return;
        }

        if (file.size > 4 * 1024 * 1024) {
            toast({ title: 'File too large', description: 'Max file size is 4MB', variant: 'destructive' });
            return;
        }

        setUploading(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: data
            });
            const result = await res.json();

            if (res.ok && result.url) {
                setFormData(prev => ({ ...prev, link: result.url }));
                toast({ title: 'Uploaded', description: 'File uploaded successfully' });
            } else {
                throw new Error(result.details || result.error || 'Upload failed');
            }
        } catch (error: any) {
            console.error("Upload Error:", error);
            toast({ title: 'Error', description: error.message || 'File upload failed', variant: 'destructive' });
        } finally {
            setUploading(false);
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
                                            accept=".pdf"
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
