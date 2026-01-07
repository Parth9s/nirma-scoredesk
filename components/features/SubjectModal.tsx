import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, BarChart3, Clock, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface Subject {
    id: string;
    name: string;
    code: string;
    credits: number;
    // Add other fields as needed from your Subject type
}

interface SubjectModalProps {
    subject: Subject | null;
    isOpen: boolean;
    onClose: () => void;
}

export function SubjectModal({ subject, isOpen, onClose }: SubjectModalProps) {
    if (!subject) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold">{subject.name}</DialogTitle>
                            <DialogDescription className="text-sm font-mono mt-1 text-primary bg-primary/10 w-fit px-2 py-0.5 rounded">
                                {subject.code}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 my-4">
                    <div className="bg-slate-50 p-3 rounded-lg border flex flex-col items-center justify-center text-center">
                        <GraduationCap className="h-5 w-5 text-slate-500 mb-1" />
                        <span className="text-2xl font-bold text-slate-800">{subject.credits}</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Credits</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Quick Actions</h4>

                    <Button className="w-full justify-start text-left h-auto py-3 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-900 border border-purple-200 shadow-sm" asChild>
                        <Link href={`/dashboard/resources/notes?subject=${encodeURIComponent(subject.name)}&subjectId=${subject.id}`}>
                            <div className="bg-white p-2 rounded-full mr-3 shadow-sm">
                                <BookOpen className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="font-bold">View Notes</div>
                                <div className="text-xs opacity-80">Lecture slides & handwritten notes</div>
                            </div>
                        </Link>
                    </Button>

                    <Button className="w-full justify-start text-left h-auto py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 shadow-sm" asChild>
                        <Link href={`/dashboard/resources/pyq?subject=${encodeURIComponent(subject.name)}&subjectId=${subject.id}`}>
                            <div className="bg-white p-2 rounded-full mr-3 shadow-sm">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="font-bold">Previous Year Questions</div>
                                <div className="text-xs opacity-80">Exam papers & solutions</div>
                            </div>
                        </Link>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
