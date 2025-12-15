import { useState, useCallback } from 'react';

type TimeUnit = 'ms' | 's';

interface ToastOptions {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastOptions[]>([]);

    const toast = useCallback(({ title, description, variant = 'default' }: ToastOptions) => {
        // Simple console log for now as UI toast provider isn't set up
        console.log(`[TOAST - ${variant}]: ${title} - ${description}`);
        // potentially add to a state to render if we had a provider
    }, []);

    return { toast };
}
