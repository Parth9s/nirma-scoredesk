import { Suspense } from 'react';
import { ResourceList } from '@/components/features/ResourceList';
import { SkeletonCard } from '@/components/ui/skeleton-card';

export default function PYQPage() {
    return (
        <div className="p-8">
            <Suspense fallback={<div className="grid gap-4 md:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}>
                <ResourceList type="PYQ" />
            </Suspense>
        </div>
    );
}
