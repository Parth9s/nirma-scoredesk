
import { Card, CardContent } from "@/components/ui/card"

export function SkeletonCard() {
    return (
        <Card className="h-full">
            <CardContent className="p-4 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-full space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
                        <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
                        <div className="flex gap-2 mt-4">
                            <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
                            <div className="h-3 bg-gray-100 rounded w-20 animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="pt-2">
                    <div className="h-8 bg-gray-100 rounded w-full animate-pulse" />
                </div>
            </CardContent>
        </Card>
    )
}
