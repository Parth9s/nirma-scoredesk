'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User, Search, ShieldCheck, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface UserData {
    id: string;
    name: string | null;
    email: string;
    role: string;
    hasGlobalAccess: boolean;
    createdAt: string;
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

export default function AccessManagementPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [toggling, setToggling] = useState<string | null>(null);

    // Create User State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [creating, setCreating] = useState(false);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const finalEmail = newUserEmail + '@nirmauni.ac.in';
            const res = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: finalEmail, name: newUserName })
            });

            const data = await res.json();

            if (res.ok) {
                toast({ title: 'Success', description: 'User created successfully.' });
                setIsCreateOpen(false);
                setNewUserEmail('');
                setNewUserName('');
                fetchUsers(); // Refresh list
            } else {
                throw new Error(data.error || 'Failed to create user');
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setCreating(false);
        }
    };

    const fetchUsers = async () => {
        // ... default fetchUsers implementation
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);

            const res = await fetch(`/api/admin/users?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                throw new Error('Failed to fetch users');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Could not load users.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleToggleAccess = async (userId: string, currentStatus: boolean) => {
        setToggling(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/access`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hasGlobalAccess: !currentStatus })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, hasGlobalAccess: updatedUser.hasGlobalAccess } : u));
                toast({ title: 'Success', description: `Access ${!currentStatus ? 'granted' : 'revoked'}.` });
            } else {
                throw new Error('Failed to update access');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update user access.', variant: 'destructive' });
        } finally {
            setToggling(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Access Management</h2>
                    <p className="text-muted-foreground">Grant global contribution access to trusted students.</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Student</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Nirma Email ID</Label>
                                    <div className="flex items-center">
                                        <Input
                                            id="email"
                                            type="text"
                                            placeholder="24bcexxx"
                                            value={newUserEmail}
                                            onChange={e => {
                                                // Remove @nirmauni.ac.in if user pastes it
                                                const val = e.target.value.replace('@nirmauni.ac.in', '');
                                                setNewUserEmail(val);
                                            }}
                                            className="rounded-r-none border-r-0 focus-visible:ring-0"
                                            required
                                        />
                                        <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground whitespace-nowrap">
                                            @nirmauni.ac.in
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Only enter your roll number / email prefix.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name (Optional)</Label>
                                    <Input
                                        id="name"
                                        placeholder="Student Name"
                                        value={newUserName}
                                        onChange={e => setNewUserName(e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={creating}>
                                        {creating ? 'Creating...' : 'Create User'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" onClick={fetchUsers} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Search for students by name or email to manage permissions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 max-w-sm"
                        />
                    </div>

                    <div className="border rounded-md">
                        {users.length === 0 && !loading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No users found.
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="p-4 font-medium">User</th>
                                        <th className="p-4 font-medium">Role</th>
                                        <th className="p-4 font-medium">Access Level</th>
                                        <th className="p-4 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-t hover:bg-slate-50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{user.name || 'Unknown'}</div>
                                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {user.hasGlobalAccess ? (
                                                    <span className="flex items-center text-green-600 gap-1 text-xs">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        Global Contributor
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Standard</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Label htmlFor={`access-${user.id}`} className="sr-only">Toggle Access</Label>
                                                    <Switch
                                                        id={`access-${user.id}`}
                                                        checked={user.hasGlobalAccess}
                                                        onCheckedChange={() => handleToggleAccess(user.id, user.hasGlobalAccess)}
                                                        disabled={toggling === user.id || user.role === 'ADMIN'}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
