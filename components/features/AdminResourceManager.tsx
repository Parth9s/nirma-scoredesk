'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Trash2, Plus, ExternalLink, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
type ResourceType = 'NOTE' | 'PYQ';

interface Resource {
    id: string;
    title: string;
    description?: string;
    type: string;
    url: string;
    subjectId: string;
    subject: {
        name: string;
        semester: {
            number: number;
            branch: {
                name: string;
            }
        }
    };
    year?: number | null;
    examType?: string | null;
    uploadedAt: string;
}

interface Subject {
    id: string;
    name: string;
    semester: {
        number: number;
        branch: {
            name: string;
        }
    };
}

import { BRANCHES } from '@/lib/constants';

export function AdminResourceManager() {
    const { toast } = useToast();
    const [resources, setResources] = useState<Resource[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [contributions, setContributions] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'resources' | 'contributions'>('resources');

    // Filters
    const [selectedBranch, setSelectedBranch] = useState<string>('Computer Science & Engineering');
    const [selectedSem, setSelectedSem] = useState<number>(4);
    const [filterSubject, setFilterSubject] = useState('All');

    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newRes, setNewRes] = useState<{
        title: string;
        type: ResourceType;
        description?: string;
        url: string;
        driveId?: string; // New field
        subjectId: string;
        semester: number;
        branch: string;
        year?: number;
        examType?: string;
    }>({
        title: '',
        type: 'NOTE',
        description: '',
        url: '',
        driveId: '',
        subjectId: '',
        semester: 4,
        branch: 'Computer Science & Engineering'
    });

    // State for tracking which contribution is being processed
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
        setActionLoadingId(id);
        await handleContributionAction(id, action);
        setActionLoadingId(null);
    };

    useEffect(() => {
        fetchData();
        fetchContributions();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resData, subData] = await Promise.all([
                fetch('/api/resources', { cache: 'no-store' }).then(r => r.json()),
                fetch('/api/subjects', { cache: 'no-store' }).then(r => r.json())
            ]);
            setResources(Array.isArray(resData) ? resData : []);
            setSubjects(Array.isArray(subData) ? subData : []);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const fetchContributions = async () => {
        try {
            const res = await fetch('/api/contributions');
            if (res.ok) setContributions(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast({ title: 'Invalid File', description: 'Please upload a PDF', variant: 'destructive' });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok && data.url) {
                // Save both URL and Drive ID
                setNewRes(prev => ({ ...prev, url: data.url, driveId: data.driveId }));
                toast({ title: 'Uploaded', description: 'File uploaded successfully' });
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'File upload failed', variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    const handleAdd = async () => {
        // Validate: Title is optional if PYQ, otherwise key fields are required
        const isTitleValid = newRes.type === 'PYQ' ? true : !!newRes.title;
        if (!isTitleValid || !newRes.url || !newRes.subjectId) return;

        // Auto-generate title for PYQ
        let finalTitle = newRes.title;
        if (newRes.type === 'PYQ') {
            finalTitle = `${newRes.examType || 'Exam'} ${newRes.year || new Date().getFullYear()}`;
        }

        try {
            const res = await fetch('/api/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: finalTitle,
                    description: newRes.description,
                    type: newRes.type,
                    url: newRes.url,
                    driveId: newRes.driveId, // Pass Drive ID for backend organization
                    subjectId: newRes.subjectId,
                    year: newRes.year,
                    examType: newRes.examType,
                    author: 'Admin'
                })
            });

            if (res.ok) {
                toast({ title: 'Success', description: 'Resource added successfully' });
                setIsAdding(false);
                setNewRes({ ...newRes, title: '', description: '', url: '', driveId: '', subjectId: '' });
                fetchData(); // Refresh list
            } else {
                throw new Error('Failed to add');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create resource', variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Deleted', description: 'Resource removed.' });
                setResources(prev => prev.filter(r => r.id !== id));
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
        }
    };

    const handleContributionAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
        try {
            const res = await fetch(`/api/contributions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            if (res.ok) {
                toast({ title: action === 'APPROVE' ? 'Approved' : 'Rejected', description: 'Action successful' });
                setContributions(prev => prev.filter(c => c.id !== id));
                if (action === 'APPROVE') fetchData(); // Refresh resources
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Server responded with error');
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Action failed', variant: 'destructive' });
        }
    };

    // available subjects for filtering
    const availableSubjects = subjects
        .filter(s => s.semester.branch.name === selectedBranch && s.semester.number === selectedSem)
        .map(s => s.name);

    // available subjects for form
    const formSubjects = subjects.filter(s =>
        s.semester.branch.name === newRes.branch &&
        s.semester.number === newRes.semester
    );

    const filteredResources = resources.filter(r =>
        r.subject.semester.branch.name === selectedBranch &&
        r.subject.semester.number === selectedSem &&
        (filterSubject === 'All' || r.subject.name === filterSubject)
    );

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Resource Manager</h2>
                    <p className="text-sm text-gray-500">Manage Resources & Content</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-gray-100 p-1 rounded-lg flex text-sm">
                        <button
                            className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'resources' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-900'}`}
                            onClick={() => setActiveTab('resources')}
                        >
                            Active Resources
                        </button>
                        <button
                            className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'contributions' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-900'}`}
                            onClick={() => setActiveTab('contributions')}
                        >
                            Approvals {contributions.length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{contributions.length}</span>}
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'contributions' ? (
                <div className="grid gap-4">
                    <h3 className="font-semibold text-gray-700 mb-2">Pending Student Contributions</h3>
                    {contributions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                            No pending contributions.
                        </div>
                    ) : (
                        <>
                            {contributions.map(c => {
                                const cData = JSON.parse(c.data);
                                return (
                                    <div key={c.id} className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded bg-orange-100 text-orange-600">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{cData.title}</h3>
                                                {cData.description && <p className="text-xs text-gray-600 mt-1">{cData.description}</p>}
                                                <p className="text-sm text-gray-500 mt-1">
                                                    To: <span className="font-medium text-gray-900">{subjects.find(s => s.id === cData.subjectId)?.name || 'Unknown'}</span>
                                                    <span className="text-gray-300 mx-2">|</span>
                                                    <span className="text-xs uppercase bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                                        {subjects.find(s => s.id === cData.subjectId)?.semester.branch.name} - Sem {subjects.find(s => s.id === cData.subjectId)?.semester.number}
                                                    </span>
                                                </p>
                                                <div className="text-xs text-blue-600 mt-1 font-medium">{c.type}</div>
                                                <div className="text-xs text-gray-400 mt-1">Submitted by: {c.submittedBy || 'Anonymous'}</div>
                                                <a href={cData.url} target="_blank" className="text-blue-600 text-xs hover:underline flex items-center mt-1">
                                                    Review Link <ExternalLink className="h-3 w-3 ml-1" />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-500 border-red-200 hover:bg-red-50"
                                                onClick={() => handleAction(c.id, 'REJECT')}
                                                disabled={actionLoadingId === c.id}
                                            >
                                                {actionLoadingId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reject'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleAction(c.id, 'APPROVE')}
                                                disabled={actionLoadingId === c.id}
                                            >
                                                {actionLoadingId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex justify-end">
                        <Button onClick={() => setIsAdding(!isAdding)}>
                            {isAdding ? 'Cancel' : <><Plus className="h-4 w-4 mr-2" /> Add Resource</>}
                        </Button>
                    </div>

                    {/* Global Context Filters */}
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-blue-600 font-bold uppercase">Branch</Label>
                            <select
                                className="w-full border rounded p-2 bg-white text-sm"
                                value={selectedBranch}
                                onChange={e => {
                                    setSelectedBranch(e.target.value);
                                    setSelectedSem(1);
                                    setFilterSubject('All');
                                }}
                            >
                                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-blue-600 font-bold uppercase">Semester</Label>
                            <select
                                className="w-full border rounded p-2 bg-white text-sm"
                                value={selectedSem}
                                onChange={e => {
                                    setSelectedSem(Number(e.target.value));
                                    setFilterSubject('All');
                                }}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-blue-600 font-bold uppercase">Subject Filter</Label>
                            <select
                                className="w-full border rounded p-2 bg-white text-sm"
                                value={filterSubject}
                                onChange={e => setFilterSubject(e.target.value)}
                            >
                                <option value="All">All Subjects</option>
                                {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Add Form */}
                    {isAdding && (
                        <Card className="border-l-4 border-l-green-500 animate-in fade-in slide-in-from-top-4">
                            <CardHeader><CardTitle>Add New Resource</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                                        <div className="space-y-2">
                                            <Label>Target Branch</Label>
                                            <select className="w-full border rounded p-2 text-sm" value={newRes.branch} onChange={e => setNewRes({ ...newRes, branch: e.target.value, semester: 1, subjectId: '' })}>
                                                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Target Semester</Label>
                                            <select className="w-full border rounded p-2 text-sm" value={newRes.semester} onChange={e => setNewRes({ ...newRes, semester: Number(e.target.value), subjectId: '' })}>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Subject <span className="text-red-500">*</span></Label>
                                        <select className="w-full border rounded p-2 bg-white" value={newRes.subjectId} onChange={e => setNewRes({ ...newRes, subjectId: e.target.value })}>
                                            <option value="">Select Subject</option>
                                            {formSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    {newRes.type !== 'PYQ' && (
                                        <div className="space-y-2">
                                            <Label>Title <span className="text-red-500">*</span></Label>
                                            <input className="w-full border rounded p-2" placeholder="e.g. Unit 1 Notes" value={newRes.title || ''} onChange={e => setNewRes({ ...newRes, title: e.target.value })} />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <input
                                            className="w-full border rounded p-2"
                                            placeholder="Optional description..."
                                            value={newRes.description || ''}
                                            onChange={e => setNewRes({ ...newRes, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <select className="w-full border rounded p-2 bg-white" value={newRes.type} onChange={e => setNewRes({ ...newRes, type: e.target.value as ResourceType })}>
                                            <option value="NOTE">Note</option>
                                            <option value="PYQ">PYQ (Past Paper)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Resource URL or Upload <span className="text-red-500">*</span></Label>
                                        <div className="flex gap-2">
                                            <input
                                                className="w-full border rounded p-2"
                                                placeholder="https://..."
                                                value={newRes.url || ''}
                                                onChange={e => setNewRes({ ...newRes, url: e.target.value })}
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

                                    {newRes.type === 'PYQ' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Year</Label>
                                                <input type="number" className="w-full border rounded p-2" placeholder="2024" value={newRes.year || ''} onChange={e => setNewRes({ ...newRes, year: Number(e.target.value) })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Exam Type</Label>
                                                <input className="w-full border rounded p-2" placeholder="Mid Sem" value={newRes.examType || ''} onChange={e => setNewRes({ ...newRes, examType: e.target.value })} />
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={handleAdd} disabled={!newRes.subjectId || !newRes.url || uploading || (newRes.type !== 'PYQ' && !newRes.title)}>
                                        {uploading ? 'Uploading...' : 'Save Resource'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* List */}
                    <div className="grid gap-4">
                        {filteredResources.map(res => (
                            <div key={res.id} className="bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded ${res.type === 'NOTE' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{res.title}</h3>
                                        {res.description && <p className="text-xs text-gray-600 mt-1">{res.description}</p>}
                                        <p className="text-sm text-gray-500 mt-1">
                                            {res.subject.name} <span className="text-gray-300">|</span> <span className="font-medium">{res.type}</span>
                                            {res.type === 'PYQ' && ` • ${res.examType} ${res.year}`}
                                        </p>
                                        <div className="text-xs text-gray-400 mt-1">Uploaded: {new Date(res.uploadedAt).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center mr-4">
                                        View <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                    <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(res.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {filteredResources.length === 0 && (
                            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                                No resources found for {selectedBranch} - Semester {selectedSem} {filterSubject !== 'All' ? `(${filterSubject})` : ''}.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
