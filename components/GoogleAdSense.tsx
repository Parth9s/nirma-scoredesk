'use client';

import Script from "next/script";

interface GoogleAdSenseProps {
    pId?: string;
}

export const GoogleAdSense = ({ pId }: GoogleAdSenseProps) => {
    // Only load if ID is provided
    const publisherId = pId || process.env.NEXT_PUBLIC_ADSENSE_ID;

    if (!publisherId) return null;

    return (
        <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    );
};
