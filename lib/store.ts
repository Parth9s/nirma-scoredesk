import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
    branch: string | null;
    semester: number | null;
    subjectGroup: string | null;
    setPreferences: (branch: string, semester: number, subjectGroup?: string | null) => void;
    resetPreferences: () => void;
    hasOnboarded: boolean;
}

// Cache Store for API responses
interface CacheState {
    resourceCache: Record<string, any[]>;
    setCache: (key: string, data: any[]) => void;
    getCache: (key: string) => any[] | null;
}

export const useCacheStore = create<CacheState>((set, get) => ({
    resourceCache: {},
    setCache: (key, data) => set((state) => ({ resourceCache: { ...state.resourceCache, [key]: data } })),
    getCache: (key) => get().resourceCache[key] || null,
}));

export const usePreferencesStore = create<UserPreferences>()(
    persist(
        (set) => ({
            branch: null,
            semester: null,
            subjectGroup: null, // '1' (Physics/Cycle A) or '2' (Chemistry/Cycle B)
            hasOnboarded: false,
            setPreferences: (branch, semester, subjectGroup = null) => set({ branch, semester, subjectGroup, hasOnboarded: true }),
            resetPreferences: () => set({ branch: null, semester: null, subjectGroup: null, hasOnboarded: false }),
        }),
        {
            name: 'nirma-scoredesk-prefs',
        }
    )
);
