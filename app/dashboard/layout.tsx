'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Menu, X, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen dashboard-theme flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-gradient-to-br from-slate-200 to-white border-b sticky top-0 z-30">
                <span className="text-primary great-vibes-regular text-2xl">Stride</span>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                    <Menu className="h-6 w-6" />
                </Button>
            </div>

            {/* Sidebar (Desktop: Always visible, Mobile: Conditional via Overlay) */}
            <div className={`
                fixed inset-y-0 left-0 z-[60] w-64 bg-gradient-to-br from-slate-200 to-white border-r transform transition-transform duration-200 ease-in-out md:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:block
            `}>
                <div className="h-full relative">
                    {/* Mobile Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 md:hidden z-50 text-gray-500 hover:text-red-500"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                    <Sidebar onLinkClick={() => setIsSidebarOpen(false)} />
                </div>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-[55] bg-black/50 md:hidden animate-in fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 w-full p-0 md:p-0 overflow-x-hidden">

                {children}
            </div>
        </div>
    );
}
