'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Calculator,
    GraduationCap,
    BookOpen,
    FileText,
    Upload,
    Sparkles,
    Calendar,
    Info
} from 'lucide-react';
import { usePreferencesStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/attendance', label: 'Attendance', icon: Calculator },
    { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
    { href: '/dashboard/sgpa', label: 'SGPA/CGPA', icon: GraduationCap },
    { href: '/dashboard/resources/notes', label: 'Notes', icon: FileText },
    { href: '/dashboard/resources/pyq', label: 'PYQ', icon: BookOpen },
    { href: '/dashboard/contribute', label: 'Contribute', icon: Upload },
    { href: '/dashboard/about', label: 'About Us', icon: Info },
    { href: '#', label: 'AI Exam Predictor (Coming Soon)', icon: Sparkles, disabled: true },
];

export function Sidebar({ className, onLinkClick }: { className?: string, onLinkClick?: () => void }) {
    const pathname = usePathname();
    const { branch, semester } = usePreferencesStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <aside className={cn("h-screen w-64 border-r bg-sidebar flex flex-col", className)}>
            <div className="flex h-16 items-center px-6 border-b shrink-0 bg-sidebar">
                <h1 className="text-3xl tracking-tight text-sidebar-primary great-vibes-regular">Stride</h1>
            </div>

            <div className="p-4 border-b bg-white shrink-0">
                <div className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">Current</div>
                {mounted ? (
                    <>
                        <div className="mt-1 font-semibold text-sidebar-foreground marquee-container">
                            <div className="marquee-content">{branch || 'Select Branch'}</div>
                        </div>
                        <div className="text-sm text-sidebar-foreground/80">Semester {semester || '-'}</div>
                    </>
                ) : (
                    <>
                        <div className="mt-1 font-semibold truncate text-sidebar-foreground">Loading...</div>
                        <div className="text-sm text-sidebar-foreground/80">Semester -</div>
                    </>
                )}
            </div>

            <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        onClick={onLinkClick}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            pathname === item.href
                                ? "bg-slate-900 text-white shadow-sm"
                                : "text-sidebar-foreground hover:bg-slate-100",
                            // @ts-ignore
                            item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                        )}
                        // @ts-ignore
                        aria-disabled={item.disabled}
                    >
                        <item.icon className={cn("h-4 w-4", pathname === item.href ? "text-white" : "text-sidebar-foreground")} />
                        {item.label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
