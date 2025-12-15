import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
    branch: string | null;
    semester: number | null;
    setPreferences: (branch: string, semester: number) => void;
    resetPreferences: () => void;
    hasOnboarded: boolean;
}

export const usePreferencesStore = create<UserPreferences>()(
    persist(
        (set) => ({
            branch: null,
            semester: null,
            hasOnboarded: false,
            setPreferences: (branch, semester) => set({ branch, semester, hasOnboarded: true }),
            resetPreferences: () => set({ branch: null, semester: null, hasOnboarded: false }),
        }),
        {
            name: 'nirma-scoredesk-prefs',
        }
    )
);
