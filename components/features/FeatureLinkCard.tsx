'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";

interface FeatureLinkCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    colorClass: string;
    buttonText?: string;
}

export function FeatureLinkCard({ title, description, icon: Icon, href, colorClass, buttonText = "Open" }: FeatureLinkCardProps) {
    return (
        <Card className={`group hover:shadow-lg transition-all duration-300 border-l-4 ${colorClass}`}>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-lg bg-opacity-10 ${colorClass.replace("border-l-", "bg-").replace("-500", "-100")} ${colorClass.replace("border-l-", "text-")}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <Link href={href}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                            {buttonText} <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                    </Link>
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 mb-4 h-10">{description}</p>
                <Link href={href}>
                    <Button className="w-full" variant="secondary">Go to {title}</Button>
                </Link>
            </CardContent>
        </Card>
    );
}
