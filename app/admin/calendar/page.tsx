import { AdminCalendarManager } from '@/components/features/AdminCalendarManager';
import { AdminHolidayManager } from '@/components/features/AdminHolidayManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminCalendarPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Calendar Management</h1>
            <Tabs defaultValue="pdf" className="w-full">
                <TabsList>
                    <TabsTrigger value="pdf">Academic Calendar (PDF)</TabsTrigger>
                    <TabsTrigger value="holidays">Holiday Manager</TabsTrigger>
                </TabsList>
                <TabsContent value="pdf" className="mt-4">
                    <AdminCalendarManager />
                </TabsContent>
                <TabsContent value="holidays" className="mt-4">
                    <AdminHolidayManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}
