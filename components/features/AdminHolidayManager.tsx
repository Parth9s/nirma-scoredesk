'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Trash2, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Holiday = {
    id: string;
    name: string;
    date: string;
    isFloating: boolean;
};

export function AdminHolidayManager() {
    const { toast } = useToast();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/holidays');
            if (res.ok) {
                const data = await res.json();
                setHolidays(data);
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to fetch holidays', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !date) return;

        setAdding(true);
        try {
            const res = await fetch('/api/holidays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, date })
            });

            if (res.ok) {
                const newHoliday = await res.json();
                setHolidays([...holidays, newHoliday].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
                setName('');
                setDate('');
                toast({ title: 'Success', description: 'Holiday added successfully' });
            } else {
                throw new Error('Failed to add');
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to add holiday', variant: 'destructive' });
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this holiday?')) return;

        try {
            const res = await fetch(`/api/holidays/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setHolidays(holidays.filter(h => h.id !== id));
                toast({ title: 'Deleted', description: 'Holiday removed' });
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete holiday', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Holiday Manager</h2>
                    <p className="text-sm text-gray-500">Manage holidays for the "Mini Vacation" predictor.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Add Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Add Holiday
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Holiday Name</Label>
                                <Input
                                    placeholder="e.g. Diwali"
                                    value={name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={adding || !name || !date}>
                                {adding ? <Loader2 className="animate-spin h-4 w-4" /> : 'Add Holiday'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Upcoming Holidays
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                        ) : holidays.length === 0 ? (
                            <div className="text-center p-8 text-gray-500">No holidays added yet.</div>
                        ) : (
                            <div className="space-y-2">
                                {holidays.map(holiday => (
                                    <div key={holiday.id} className="flex items-center justify-between p-3 border rounded-md bg-white hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-100 text-blue-700 w-12 h-12 flex flex-col items-center justify-center rounded-md text-xs font-bold border border-blue-200">
                                                <span>{format(new Date(holiday.date), 'MMM')}</span>
                                                <span className="text-lg leading-none">{format(new Date(holiday.date), 'd')}</span>
                                            </div>
                                            <div>
                                                <div className="font-semibold">{holiday.name}</div>
                                                <div className="text-sm text-gray-500">{format(new Date(holiday.date), 'EEEE, yyyy')}</div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(holiday.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
