'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Assignment {
    id: string;
    title: string;
    subject: {
        name: string;
        code: string;
    };
    facultyName: string;
    studentName: string;
    downloads: number;
    createdAt: string;
}

export default function AdminAssignmentsPage() {
    const { toast } = useToast();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            // Fetch ALL assignments (no filters)
            const res = await fetch('/api/assignments');
            if (res.ok) {
                setAssignments(await res.json());
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to fetch assignments', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this assignment?')) return;

        setDeleting(id);
        try {
            const res = await fetch(`/api/assignments?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Deleted', description: 'Assignment removed successfully.' });
                setAssignments(prev => prev.filter(a => a.id !== id));
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Could not delete assignment', variant: 'destructive' });
        } finally {
            setDeleting(null);
        }
    };

    const filtered = assignments.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.studentName.toLowerCase().includes(search.toLowerCase()) ||
        a.facultyName.toLowerCase().includes(search.toLowerCase()) ||
        a.subject.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Assignment Management</h2>
                    <p className="text-muted-foreground">Monitor and moderate peer uploads.</p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search assignments..."
                        className="pl-10 h-10 bg-white"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Uploads ({filtered.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Uploaded By</TableHead>
                                    <TableHead>Faculty</TableHead>
                                    <TableHead>Downloads</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No assignments found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((assignment) => (
                                        <TableRow key={assignment.id}>
                                            <TableCell className="font-medium">{assignment.title}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{assignment.subject.code}</span>
                                                    <span className="text-xs text-muted-foreground">{assignment.subject.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{assignment.studentName}</TableCell>
                                            <TableCell>{assignment.facultyName}</TableCell>
                                            <TableCell>{assignment.downloads}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    disabled={deleting === assignment.id}
                                                    onClick={() => handleDelete(assignment.id)}
                                                >
                                                    {deleting === assignment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
