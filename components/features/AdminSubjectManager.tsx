'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EvalComponent {
    type: string; // CE, LPW, SEE, PW
    weight: number;
    maxMarks: number;
}

interface Subject {
    id: string;
    name: string;
    code: string;
    credits: number;
    semester: {
        number: number;
        branch: {
            name: string;
        }
    };
    evaluationConfigs?: EvalComponent[];
}

import { BRANCHES } from '@/lib/constants';

export function AdminSubjectManager() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    // Filters
    const [selectedBranch, setSelectedBranch] = useState<string>('Computer Science & Engineering');
    const [selectedSem, setSelectedSem] = useState<number>(4);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    // editForm structure: { name, code, credits, components: EvalComponent[] }

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/subjects', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setSubjects(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to fetch subjects', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const filteredSubjects = subjects.filter(s =>
        s.semester?.branch?.name === selectedBranch && s.semester?.number === selectedSem
    );

    const handleAddSubject = async () => {
        setLoading(true);
        try {
            // Stronger unique code
            const tempCode = `NEW-${Math.floor(Math.random() * 100000)}`;

            const res = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'New Subject',
                    code: tempCode,
                    credits: 3,
                    branchName: selectedBranch,
                    semesterNumber: selectedSem
                })
            });

            if (res.ok) {
                toast({ title: 'Created', description: 'New subject added. Please edit details.' });
                fetchSubjects();
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create');
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Could not create subject', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // if (!confirm('Are you sure? This will delete all resources and data for this subject.')) return;

        try {
            const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Deleted', description: 'Subject removed' });
                setSubjects(prev => prev.filter(s => s.id !== id));
                fetchSubjects();
            } else {
                throw new Error('Failed');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' });
        }
    };

    const startEdit = (sub: Subject) => {
        setEditingId(sub.id);

        let components: EvalComponent[] = [];
        if (sub.evaluationConfigs) {
            components = [...sub.evaluationConfigs];
        }

        setEditForm({
            name: sub.name,
            code: sub.code,
            credits: sub.credits,
            components: components
        });
    };

    const updateComponent = (idx: number, field: keyof EvalComponent, value: string | number) => {
        const newComps = [...editForm.components];
        newComps[idx] = { ...newComps[idx], [field]: value };
        setEditForm({ ...editForm, components: newComps });
    };

    const addComponent = () => {
        setEditForm({
            ...editForm,
            components: [...(editForm.components || []), { type: 'CE', weight: 40, maxMarks: 100 }]
        });
    };

    const removeComponent = (idx: number) => {
        const newComps = [...editForm.components];
        newComps.splice(idx, 1);
        setEditForm({ ...editForm, components: newComps });
    };

    const saveEdit = async (id: string) => {
        try {
            const payload = {
                name: editForm.name,
                code: editForm.code,
                credits: editForm.credits,
                evaluationConfigs: editForm.components
            };

            const res = await fetch(`/api/subjects/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast({ title: 'Saved', description: 'Subject updated' });
                setEditingId(null);
                fetchSubjects();
            } else {
                throw new Error('Failed');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Update failed', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Manage Subjects & Policies</h2>
                    <p className="text-sm text-gray-500">Define curriculum and evaluation schemes per Branch/Sem</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchSubjects} title="Refresh">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={handleAddSubject} disabled={loading}>
                        <Plus className="h-4 w-4 mr-2" /> Add Subject to Selection
                    </Button>
                </div>
            </div>

            {/* Hierarchical Filters */}
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

            <div className="grid gap-6">
                {loading && <div className="text-center py-4"><Loader2 className="animate-spin h-6 w-6 mx-auto text-blue-500" /></div>}

                {!loading && filteredSubjects.length === 0 && (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 border border-dashed rounded">
                        No subjects defined for {selectedBranch} Semester {selectedSem}.
                        <br />Click "Add Subject" to start.
                    </div>
                )}

                {filteredSubjects.map(sub => (
                    <Card key={sub.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            {editingId === sub.id ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                                    <input
                                        className="border rounded px-2 py-1"
                                        placeholder="Name"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                    <input
                                        className="border rounded px-2 py-1"
                                        placeholder="Code"
                                        value={editForm.code}
                                        onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs">Credits:</span>
                                        <input
                                            type="number"
                                            className="border rounded px-2 py-1 w-20"
                                            value={editForm.credits}
                                            onChange={e => setEditForm({ ...editForm, credits: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <CardTitle className="text-lg">{sub.name} <span className="text-sm font-normal text-gray-500">({sub.code}) - {sub.credits} Credits</span></CardTitle>
                            )}

                            <div className="flex gap-2 ml-4">
                                {editingId === sub.id ? (
                                    <>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                        <Button size="sm" onClick={() => saveEdit(sub.id)}><Save className="h-4 w-4" /></Button>
                                    </>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => startEdit(sub)}>Edit</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(sub.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-4 rounded-md space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-sm">Evaluation Policy</h4>
                                    {editingId === sub.id && (
                                        <Button size="sm" variant="ghost" onClick={addComponent} className="text-blue-600 text-xs">
                                            + Add Component
                                        </Button>
                                    )}
                                </div>

                                {editingId === sub.id ? (
                                    <div className="space-y-2">
                                        {editForm.components?.map((comp: EvalComponent, idx: number) => (
                                            <div key={idx} className="flex gap-2 items-center text-sm">
                                                <select
                                                    className="border rounded p-1 w-20"
                                                    value={comp.type}
                                                    onChange={e => updateComponent(idx, 'type', e.target.value)}
                                                >
                                                    <option>CE</option><option>LPW</option><option>SEE</option><option>PW</option>
                                                </select>
                                                <label className="text-xs text-gray-500">Wt%:</label>
                                                <input
                                                    type="number"
                                                    className="w-14 border rounded p-1"
                                                    value={comp.weight}
                                                    onChange={e => updateComponent(idx, 'weight', Number(e.target.value))}
                                                />
                                                <label className="text-xs text-gray-500">Max:</label>
                                                <input
                                                    type="number"
                                                    className="w-14 border rounded p-1"
                                                    value={comp.maxMarks}
                                                    onChange={e => updateComponent(idx, 'maxMarks', Number(e.target.value))}
                                                />
                                                <Button size="sm" variant="ghost" className="text-red-500 h-6 w-6 p-0" onClick={() => removeComponent(idx)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {sub.evaluationConfigs && sub.evaluationConfigs.length > 0 ? (
                                            sub.evaluationConfigs.map((comp, i) => (
                                                <div key={i} className="flex gap-4 text-xs">
                                                    <span className="font-semibold w-8">{comp.type}</span>
                                                    <span className="text-gray-600">Weight: {comp.weight}%</span>
                                                    <span className="text-gray-400">Max Marks: {comp.maxMarks}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-400">No evaluation components defined.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
