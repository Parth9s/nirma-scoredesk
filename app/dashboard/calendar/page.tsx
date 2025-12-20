'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar as CalendarIcon, Sun, Coffee, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addDays, getDay, isWeekend, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

type Holiday = {
    id: string;
    name: string;
    date: string;
    isFloating: boolean;
};

type Suggestion = {
    date: Date;
    type: 'leave_mon' | 'leave_fri' | 'long_weekend';
    reason: string;
};

export default function CalendarPage() {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const res = await fetch('/api/holidays');
                if (res.ok) {
                    const data = await res.json();
                    setHolidays(data);
                }
            } catch (error) {
                console.error("Failed to fetch holidays", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHolidays();
    }, []);

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    const previousMonth = () => {
        setCurrentDate(curr => new Date(curr.getFullYear(), curr.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(curr => new Date(curr.getFullYear(), curr.getMonth() + 1, 1));
    };

    // "Mini Vacation" Logic
    const getSuggestion = (day: Date): Suggestion | null => {
        const isHolidayToday = holidays.some(h => isSameDay(new Date(h.date), day));
        if (isHolidayToday) return null;

        const dayOfWeek = getDay(day);

        // Case 1: Tuesday Holiday -> Monday Off
        if (dayOfWeek === 1) {
            const tuesday = addDays(day, 1);
            const isTueHoliday = holidays.some(h => isSameDay(new Date(h.date), tuesday));
            if (isTueHoliday) {
                return { date: day, type: 'leave_mon', reason: 'Take Monday off for 4 days!' };
            }
        }

        // Case 2: Thursday Holiday -> Friday Off
        if (dayOfWeek === 5) {
            const thursday = subDays(day, 1);
            const isThuHoliday = holidays.some(h => isSameDay(new Date(h.date), thursday));
            if (isThuHoliday) {
                return { date: day, type: 'leave_fri', reason: 'Take Friday off for 4 days!' };
            }
        }

        return null;
    };

    const getDayContent = (day: Date) => {
        const holiday = holidays.find(h => isSameDay(new Date(h.date), day));
        const suggestion = getSuggestion(day);

        return { holiday, suggestion };
    };

    const getPartOfVacation = (day: Date) => {
        if (!isWeekend(day)) return false;

        // Check if upcoming Monday is a "leave_mon" suggestion (Sat/Sun before Mon)
        // If day is Sat, Mon is +2. If day is Sun, Mon is +1.
        const nextMonday = addDays(day, getDay(day) === 6 ? 2 : 1);
        const monSuggestion = getSuggestion(nextMonday);
        if (monSuggestion?.type === 'leave_mon') return true;

        // Check if past Friday is a "leave_fri" suggestion (Sat/Sun after Fri)
        // If day is Sat, Fri is -1. If day is Sun, Fri is -2.
        const prevFriday = subDays(day, getDay(day) === 6 ? 1 : 2);
        const friSuggestion = getSuggestion(prevFriday);
        if (friSuggestion?.type === 'leave_fri') return true;

        return false;
    };

    return (
        <div className="space-y-8 p-6 md:p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                            Calendar & Vacations
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Smart planning for your next break.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-card/50 backdrop-blur-sm p-1.5 rounded-2xl border shadow-sm">
                    <Button variant="ghost" size="icon" onClick={previousMonth} className="rounded-xl hover:bg-card hover:shadow-md transition-all">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center px-6 font-bold text-lg w-48 justify-center text-card-foreground">
                        {format(currentDate, 'MMMM yyyy')}
                    </div>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl hover:bg-card hover:shadow-md transition-all">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
            ) : (
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Calendar Grid */}
                    <Card className="lg:col-span-3 border-none shadow-none bg-card/80 backdrop-blur-xl ring-1 ring-border/50 rounded-3xl overflow-hidden">
                        <CardContent className="p-6 md:p-8">
                            <div className="grid grid-cols-7 mb-6 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                <div>Sun</div>
                                <div>Mon</div>
                                <div>Tue</div>
                                <div>Wed</div>
                                <div>Thu</div>
                                <div>Fri</div>
                                <div>Sat</div>
                            </div>

                            <div className="grid grid-cols-7 gap-2 md:gap-3">
                                {/* Pad start of month */}
                                {Array.from({ length: getDay(startOfMonth(currentDate)) }).map((_, i) => (
                                    <div key={`pad-${i}`} className="h-16 md:h-24 bg-muted/30 rounded-2xl" />
                                ))}

                                {days.map((day, i) => {
                                    const { holiday, suggestion } = getDayContent(day);
                                    const isToday = isSameDay(day, new Date());
                                    const isWeekendDay = isWeekend(day);
                                    const isVacationWeekend = getPartOfVacation(day);

                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "h-16 md:h-24 border-2 rounded-2xl p-2 md:p-3 flex flex-col justify-between transition-all relative group shadow-sm hover:shadow-md bg-card hover:scale-[1.02] hover:-translate-y-0.5",
                                                isToday && "border-primary shadow-primary/20 shadow-lg",
                                                suggestion && "border-emerald-400 bg-emerald-50/50",
                                                holiday && "border-rose-200 bg-rose-50/50",
                                                isVacationWeekend && "border-emerald-200 bg-emerald-50/30",
                                                !holiday && !suggestion && !isVacationWeekend && isWeekendDay && "border-amber-100/50 bg-amber-50/60",
                                                !holiday && !suggestion && !isWeekendDay && "border-border"
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={cn(
                                                    "text-[10px] md:text-sm font-bold w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-colors",
                                                    isToday ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "text-muted-foreground group-hover:bg-muted"
                                                )}>
                                                    {format(day, 'd')}
                                                </span>
                                            </div>

                                            <div className="space-y-1 overflow-hidden">
                                                {holiday && (
                                                    <div
                                                        className="text-[9px] md:text-xs bg-rose-100 text-rose-700 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg font-bold border border-rose-200/50 whitespace-nowrap overflow-hidden [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]"
                                                        title={holiday.name}
                                                    >
                                                        {holiday.name}
                                                    </div>
                                                )}
                                                {suggestion && (
                                                    <div
                                                        className="text-[9px] md:text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg font-bold flex items-center gap-1 cursor-help border border-emerald-200/50 shadow-sm whitespace-nowrap overflow-hidden [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]"
                                                        title={suggestion.reason}
                                                    >
                                                        <Sparkles className="h-3 w-3 text-emerald-600 shrink-0" />
                                                        Take Leave!
                                                    </div>
                                                )}
                                                {isVacationWeekend && (
                                                    <div className="text-[9px] text-emerald-600 font-medium flex items-center gap-1 whitespace-nowrap overflow-hidden [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
                                                        <Sun className="h-3 w-3 shrink-0" />
                                                        Long Weekend
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar Suggestions */}
                    <div className="space-y-6">
                        <div>
                            <Card className="border-none shadow-lg bg-card/80 backdrop-blur-xl rounded-3xl ring-1 ring-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-bold text-card-foreground">Upcoming Holidays</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {holidays.filter(h => new Date(h.date) >= new Date()).slice(0, 5).map(h => (
                                        <div key={h.id} className="flex gap-4 py-3 border-b border-border last:border-0 hover:bg-muted p-2 rounded-xl transition-colors">
                                            <div className="text-center w-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center py-1 border border-primary/20">
                                                <div className="text-[10px] font-bold text-primary uppercase tracking-wider">{format(new Date(h.date), 'MMM')}</div>
                                                <div className="text-lg font-extrabold text-primary leading-none">{format(new Date(h.date), 'd')}</div>
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <div className="font-bold text-card-foreground">{h.name}</div>
                                                <div className="text-xs font-medium text-muted-foreground">{format(new Date(h.date), 'EEEE')}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {holidays.filter(h => new Date(h.date) >= new Date()).length === 0 && (
                                        <div className="text-sm text-muted-foreground py-4 text-center italic">No upcoming holidays found.</div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Strategy Explainer */}
                        <Card className="border-none shadow-md bg-gradient-to-br from-indigo-50 to-white/50 backdrop-blur-xl rounded-3xl ring-1 ring-indigo-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-indigo-600" />
                                    Strategic Leave Planning
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-indigo-800 leading-relaxed font-medium">
                                Optimize your schedule by combining weekends with upcoming holidays. The system automatically identifies opportunities for extended breaks with minimal leave required.
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
