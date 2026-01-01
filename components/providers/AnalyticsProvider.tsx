"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    useEffect(() => {
        if (!session?.user) return;

        const sendHeartbeat = async () => {
            try {
                await fetch('/api/user/heartbeat', { method: 'POST' });
            } catch (e) {
                // Ignore heartbeat errors silently
            }
        };

        // Send immediately on mount
        sendHeartbeat();

        // Send every 5 minutes
        const interval = setInterval(sendHeartbeat, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [session]);

    return <>{children}</>;
}
