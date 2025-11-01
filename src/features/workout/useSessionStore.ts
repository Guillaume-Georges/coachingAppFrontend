import { create } from 'zustand';

type State = {
  status: 'idle' | 'inProgress' | 'paused' | 'review' | 'submitted';
  startedAt?: number;
  elapsedSec: number;
  rpe?: number;
  notes?: string;
};

type Actions = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  complete: () => void;
  tick: (sec: number) => void;
  setRpe: (r: number) => void;
  setNotes: (n: string) => void;
  reset: () => void;
};

export const useSessionStore = create<State & Actions>((set) => ({
  status: 'idle',
  elapsedSec: 0,
  start: () => set({ status: 'inProgress', startedAt: Date.now() }),
  pause: () => set({ status: 'paused' }),
  resume: () => set({ status: 'inProgress' }),
  complete: () => set({ status: 'review' }),
  tick: (sec) => set((s) => ({ elapsedSec: s.elapsedSec + sec })),
  setRpe: (r) => set({ rpe: r }),
  setNotes: (n) => set({ notes: n }),
  reset: () => set({ status: 'idle', elapsedSec: 0, rpe: undefined, notes: undefined, startedAt: undefined }),
}));

