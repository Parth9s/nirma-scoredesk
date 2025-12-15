import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface AdBannerProps {
    className?: string;
    slotId?: string; // Future: Google AdSense Slot ID
    format?: 'horizontal' | 'vertical' | 'rectangle';
}

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

export function AdBanner({ className, slotId, format = 'horizontal' }: AdBannerProps) {
    const enableAds = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';

    useEffect(() => {
        if (enableAds && slotId) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (err) {
                console.error('AdSense error:', err);
            }
        }
    }, [enableAds, slotId]);

    // If Ads are ENABLED and we have a Slot ID -> Show Real Ad
    if (enableAds && slotId) {
        return (
            <div className={cn(
                "overflow-hidden flex items-center justify-center",
                format === 'horizontal' && "min-h-[100px] w-full",
                className
            )}>
                <ins className="adsbygoogle"
                    style={{ display: 'block', width: '100%' }}
                    data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
                    data-ad-slot={slotId}
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                />
            </div>
        );
    }

    // Default: Placeholder View
    return (
        <div className={cn(
            "bg-gray-100 border border-gray-200 border-dashed rounded-lg flex items-center justify-center overflow-hidden relative group",
            format === 'horizontal' && "min-h-[100px] w-full",
            format === 'vertical' && "min-w-[200px] h-full",
            format === 'rectangle' && "min-h-[250px] w-full",
            className
        )}>
            <div className="absolute inset-0 bg-gray-50 opacity-50 patterned-background" />
            <div className="text-center z-10 px-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Advertisement</p>
                <div className="text-sm text-gray-400 font-mono">
                    {slotId ? `Ad Slot: ${slotId} ` : 'Place Ad Here'}
                </div>
            </div>

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs text-black/40">Sponsored</span>
            </div>
        </div>
    );
}
