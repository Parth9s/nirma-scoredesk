'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Users, BookOpen, Settings, LogOut, CheckSquare, FileText, Calendar, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Legacy mock auth removed. Relying on Middleware/NextAuth.
        // const token = localStorage.getItem('admin_token');
        // if (!token && pathname !== '/admin/login') {
        //     router.push('/admin/login');
        // }
    }, [pathname, router]);

    if (!mounted) return null;
    if (pathname === '/admin/login') return <>{children}</>;

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
    };

    return (
        <div className="min-h-screen flex">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-700">
                    <h1 className="font-bold text-lg">Admin Panel</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">

                    <Link href="/admin/subjects" className={cn("flex items-center gap-3 px-3 py-2 rounded transition-colors", pathname.includes('subjects') ? "bg-slate-800 text-blue-400" : "hover:bg-slate-800")}>
                        <BookOpen className="h-4 w-4" /> Subjects & Policies
                    </Link>
                    <Link href="/admin/insights" className={cn("flex items-center gap-3 px-3 py-2 rounded transition-colors", pathname.includes('insights') ? "bg-slate-800 text-blue-400" : "hover:bg-slate-800")}>
                        <Activity className="h-4 w-4" /> Insights (Users)
                    </Link>
                    <Link href="/admin/resources" className={cn("flex items-center gap-3 px-3 py-2 rounded transition-colors", pathname.includes('resources') ? "bg-slate-800 text-blue-400" : "hover:bg-slate-800")}>
                        <FileText className="h-4 w-4" /> Resources / Notes
                    </Link>
                    <Link href="/admin/calendar" className={cn("flex items-center gap-3 px-3 py-2 rounded transition-colors", pathname.includes('calendar') ? "bg-slate-800 text-blue-400" : "hover:bg-slate-800")}>
                        <Calendar className="h-4 w-4" /> Calendar / Holidays
                    </Link>
                    <Link href="/admin/access" className={cn("flex items-center gap-3 px-3 py-2 rounded transition-colors", pathname.includes('access') ? "bg-slate-800 text-blue-400" : "hover:bg-slate-800")}>
                        <Users className="h-4 w-4" /> Access Management
                    </Link>
                </nav>
                <div className="p-4 border-t border-slate-700">
                    <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-slate-800 px-2" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    );
}
