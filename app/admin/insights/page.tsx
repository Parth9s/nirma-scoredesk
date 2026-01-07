'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Clock, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminInsightsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [usersRes, logsRes] = await Promise.all([
                fetch('/api/admin/analytics/users'),
                fetch('/api/admin/analytics/logs')
            ]);

            const userData = await usersRes.json();
            const logsData = await logsRes.json();

            setData({ ...userData, logs: logsData.logs });
        } catch (e) {
            console.error('Failed to fetch analytics', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="p-8">Loading insights...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Insights & Analytics</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users (Now)</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.activeCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Online in last 5 mins</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.activeUsers?.map((user: any) => (
                                <div key={user.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium">{user.name || user.email}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                                            {formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {data?.activeUsers?.length === 0 && <p className="text-sm text-gray-500">No active users.</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Login Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {data?.recentLogins?.map((log: any) => (
                                <div key={log.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Shield className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{log.user?.name || log.user?.email}</p>
                                            <p className="text-xs text-gray-500">
                                                {log.user?.name ? log.user?.email + ' • ' : ''}
                                                Logged in via {JSON.parse(log.metadata || '{}').provider}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                    </div>
                                </div>
                            ))}
                            {data?.recentLogins?.length === 0 && <p className="text-sm text-gray-500">No login history yet.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
