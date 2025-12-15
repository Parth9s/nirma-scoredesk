import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

export interface EvalComponent {
    type: string;
    weight: number;
    maxMarks: number;
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    credits: number;
    branch: string;
    semester: number;
    components: EvalComponent[];
}

// ----------------------------------------------------------------------
// STORE STATE
// ----------------------------------------------------------------------

interface AdminStore {
    subjects: Subject[];
    calendarUrls: Record<string, Record<number, string>>; // Branch -> Sem -> URL
    fetchSubjects: () => Promise<void>;
    fetchCalendarUrl: (branch: string, sem: number) => Promise<void>;

    // Actions - Subjects
    addSubject: (subject: Subject) => void;
    updateSubject: (id: string, updates: Partial<Subject>) => void;
    deleteSubject: (id: string) => void;
    addComponent: (subjectId: string, component: EvalComponent) => void;
    updateComponent: (subjectId: string, idx: number, updates: Partial<EvalComponent>) => void;
    deleteComponent: (subjectId: string, idx: number) => void;
}

// ----------------------------------------------------------------------
// INITIAL DATA
// ----------------------------------------------------------------------

const MOCK_SUBJECTS: Subject[] = [];

// ----------------------------------------------------------------------
// ZUSTAND STORE
// ----------------------------------------------------------------------

export const useAdminStore = create<AdminStore>()(
    persist(
        (set, get) => ({
            subjects: MOCK_SUBJECTS,
            calendarUrls: {},

            // --- SUBJECT ACTIONS ---
            fetchSubjects: async () => {
                try {
                    const res = await fetch('/api/subjects', { cache: 'no-store' });
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data)) {
                            // Normalize data structure
                            const normalized = data.map((item: any) => ({
                                ...item,
                                branch: item.semester?.branch?.name || '',
                                semester: item.semester?.number || 0,
                                components: Array.isArray(item.evaluationConfigs) ? item.evaluationConfigs : []
                            }));
                            set({ subjects: normalized });
                        } else {
                            set({ subjects: [] });
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch subjects in store', error);
                }
            },
            addSubject: (subject) => set((state) => ({ subjects: [...state.subjects, subject] })),

            updateSubject: (id, updates) => set((state) => ({
                subjects: state.subjects.map(s => s.id === id ? { ...s, ...updates } : s)
            })),

            deleteSubject: (id) => set((state) => ({
                subjects: state.subjects.filter(s => s.id !== id)
            })),

            addComponent: (subId, comp) => set((state) => ({
                subjects: state.subjects.map(s =>
                    s.id === subId ? { ...s, components: [...s.components, comp] } : s
                )
            })),

            updateComponent: (subId, idx, updates) => set((state) => ({
                subjects: state.subjects.map(s => {
                    if (s.id !== subId) return s;
                    const newComps = [...s.components];
                    newComps[idx] = { ...newComps[idx], ...updates };
                    return { ...s, components: newComps };
                })
            })),

            deleteComponent: (subId, idx) => set((state) => ({
                subjects: state.subjects.map(s => {
                    if (s.id !== subId) return s;
                    return { ...s, components: s.components.filter((_, i) => i !== idx) };
                })
            })),

            // --- CALENDAR ACTIONS ---
            fetchCalendarUrl: async (branch, sem) => {
                try {
                    const res = await fetch(`/api/calendar?branch=${encodeURIComponent(branch)}&semester=${sem}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.academicCalendarUrl) {
                            set(state => ({
                                calendarUrls: {
                                    ...state.calendarUrls,
                                    [branch]: {
                                        ...(state.calendarUrls[branch] || {}),
                                        [sem]: data.academicCalendarUrl
                                    }
                                }
                            }));
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch calendar url", e);
                }
            }
        }),
        {
            name: 'nirma-admin-store',
            partialize: (state) => ({ calendarUrls: state.calendarUrls }),
        }
    )
);
