import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { STREAK_SCORE_THRESHOLD } from '@/config/app';
import type { NatureChallenge } from '@/features/content/challenges';
import type { ProtocolTask } from '@/features/protocol/protocol';
import { requestStoreReviewAfterTask } from '@/lib/store-review';

/** Local progress: streak, XP, viking rank, per-day history (development-plan.md §8). */

export const RANKS = ['thrall', 'bonde', 'kriger', 'viking', 'jarl', 'konge'] as const;
export type Rank = (typeof RANKS)[number];

/** XP thresholds to reach each rank (cumulative). */
export const RANK_THRESHOLDS: Record<Rank, number> = {
  thrall: 0,
  bonde: 300,
  kriger: 900,
  viking: 2000,
  jarl: 4000,
  konge: 8000,
};

export function rankForXp(xp: number): Rank {
  let current: Rank = 'thrall';
  for (const rank of RANKS) {
    if (xp >= RANK_THRESHOLDS[rank]) current = rank;
  }
  return current;
}

export type DayRecord = {
  /** ids of protocol tasks completed that day */
  tasksDone: string[];
  /** Norway Score 0-100 */
  score: number;
  /** minutes logged per module */
  coldMinutes: number;
  saunaMinutes: number;
  natureMinutes: number;
};

export type XpEvent = {
  at: string; // ISO datetime
  amount: number;
  sourceKey: string; // i18n key describing the source
};

type ProgressState = {
  xp: number;
  streak: number;
  /** yyyy-mm-dd of the last day counted towards the streak */
  lastStreakDate: string | null;
  history: Record<string, DayRecord>; // key: yyyy-mm-dd
  xpLog: XpEvent[];
  cold30Day: number; // current day in the 30-day cold plan (1-based)
  cold30Completed: number[];
  /** Local yyyy-mm-dd; limits the challenge to one level advancement per day. */
  coldLastCompletedDate: string | null;
  challengesDone: string[];
  natureDailyDone: Record<string, string[]>;
  /** RO! — liczba ukończonych sesji Viking Row i najlepsza celność (0-100). */
  roSessionsCompleted: number;
  roBestAccuracy: number;
  /** Completed Kygo Jo listens; limited to one logged completion per local date. */
  musicSessionsCompleted: number;
  musicLastCompletedDate: string | null;
};

type ProgressActions = {
  addXp: (amount: number, sourceKey: string) => void;
  upsertDay: (date: string, patch: Partial<DayRecord>) => void;
  registerStreakDay: (date: string) => void;
  /**
   * Odhacza zadanie dziennego protokołu: XP, minuty modułu, Norway Score
   * (procent ukończonych zadań) i streak po przekroczeniu progu. Odhaczenia
   * nie da się cofnąć — protokół to protokół.
   */
  completeTask: (date: string, task: ProtocolTask, protocolTaskIds: readonly string[]) => void;
  reconcileDay: (date: string, protocolTaskIds: readonly string[]) => void;
  completeColdDay: (day: number, date: string) => void;
  completeChallenge: (id: string) => void;
  completeNatureChallenge: (date: string, challenge: NatureChallenge) => void;
  /** Zapisuje wynik sesji RO! (celność 0-100) do statystyk. */
  completeRoSession: (accuracy: number) => void;
  completeMusicSession: (date: string) => void;
};

const emptyDay: DayRecord = {
  tasksDone: [],
  score: 0,
  coldMinutes: 0,
  saunaMinutes: 0,
  natureMinutes: 0,
};

export const useProgress = create<ProgressState & ProgressActions>()(
  persist(
    (set) => ({
      xp: 0,
      streak: 0,
      lastStreakDate: null,
      history: {},
      xpLog: [],
      cold30Day: 1,
      cold30Completed: [],
      coldLastCompletedDate: null,
      challengesDone: [],
      natureDailyDone: {},
      roSessionsCompleted: 0,
      roBestAccuracy: 0,
      musicSessionsCompleted: 0,
      musicLastCompletedDate: null,

      addXp: (amount, sourceKey) => {
        set((s) => ({
          xp: s.xp + amount,
          xpLog: [{ at: new Date().toISOString(), amount, sourceKey }, ...s.xpLog].slice(0, 200),
        }));
        requestStoreReviewAfterTask();
      },

      upsertDay: (date, patch) =>
        set((s) => ({
          history: { ...s.history, [date]: { ...emptyDay, ...s.history[date], ...patch } },
        })),

      registerStreakDay: (date) =>
        set((s) => {
          if (s.lastStreakDate === date) return s;
          const prev = new Date(date);
          prev.setDate(prev.getDate() - 1);
          const prevKey = prev.toISOString().slice(0, 10);
          const continues = s.lastStreakDate === prevKey;
          return { streak: continues ? s.streak + 1 : 1, lastStreakDate: date };
        }),

      completeTask: (date, task, protocolTaskIds) => {
        let completedNewTask = false;
        set((s) => {
          const day = { ...emptyDay, ...s.history[date] };
          const currentTaskIds = new Set(protocolTaskIds);
          const currentTasksDone = day.tasksDone.filter((id) => currentTaskIds.has(id));
          if (currentTasksDone.includes(task.id)) {
            const score = protocolTaskIds.length
              ? Math.round((currentTasksDone.length / protocolTaskIds.length) * 100)
              : 0;
            if (day.score === score && day.tasksDone.length === currentTasksDone.length) return s;
            return {
              history: {
                ...s.history,
                [date]: { ...day, tasksDone: currentTasksDone, score },
              },
            };
          }

          completedNewTask = true;
          day.tasksDone = [...currentTasksDone, task.id];
          day.score = protocolTaskIds.length
            ? Math.round((day.tasksDone.length / protocolTaskIds.length) * 100)
            : 0;
          if (task.minutes) {
            if (task.module === 'cold') day.coldMinutes += task.minutes;
            if (task.module === 'sauna') day.saunaMinutes += task.minutes;
            if (task.module === 'nature' || task.module === 'breath') {
              day.natureMinutes += task.minutes;
            }
          }

          let { streak, lastStreakDate } = s;
          if (day.score >= STREAK_SCORE_THRESHOLD && lastStreakDate !== date) {
            const prev = new Date(date);
            prev.setDate(prev.getDate() - 1);
            const continues = lastStreakDate === prev.toISOString().slice(0, 10);
            streak = continues ? streak + 1 : 1;
            lastStreakDate = date;
          }

          return {
            history: { ...s.history, [date]: day },
            xp: s.xp + task.xp,
            xpLog: [
              { at: new Date().toISOString(), amount: task.xp, sourceKey: task.titleKey },
              ...s.xpLog,
            ].slice(0, 200),
            streak,
            lastStreakDate,
          };
        });
        if (completedNewTask) requestStoreReviewAfterTask();
      },

      reconcileDay: (date, protocolTaskIds) =>
        set((s) => {
          const existing = s.history[date];
          if (!existing) return s;

          const currentTaskIds = new Set(protocolTaskIds);
          const tasksDone = existing.tasksDone.filter((id) => currentTaskIds.has(id));
          const score = protocolTaskIds.length
            ? Math.round((tasksDone.length / protocolTaskIds.length) * 100)
            : 0;

          if (existing.score === score && existing.tasksDone.length === tasksDone.length) return s;
          return {
            history: {
              ...s.history,
              [date]: { ...existing, tasksDone, score },
            },
          };
        }),

      completeColdDay: (day, date) => {
        let completedNewDay = false;
        set((s) => {
          if (s.coldLastCompletedDate === date) return s;
          completedNewDay = true;
          return {
            cold30Completed: s.cold30Completed.includes(day)
              ? s.cold30Completed
              : [...s.cold30Completed, day],
            cold30Day: Math.min(Math.max(s.cold30Day, day + 1), 30),
            coldLastCompletedDate: date,
          };
        });
        if (completedNewDay) requestStoreReviewAfterTask();
      },

      completeChallenge: (id) =>
        set((s) => ({
          challengesDone: s.challengesDone.includes(id)
            ? s.challengesDone
            : [...s.challengesDone, id],
        })),

      completeNatureChallenge: (date, challenge) => {
        let completedNewChallenge = false;
        set((s) => {
          const natureDailyDone = s.natureDailyDone ?? {};
          const dailyDone = natureDailyDone[date] ?? [];
          if (dailyDone.includes(challenge.id)) return s;
          completedNewChallenge = true;

          const day = { ...emptyDay, ...s.history[date] };
          day.natureMinutes += challenge.minutes;

          return {
            history: { ...s.history, [date]: day },
            natureDailyDone: {
              ...natureDailyDone,
              [date]: [...dailyDone, challenge.id],
            },
            challengesDone: s.challengesDone.includes(challenge.id)
              ? s.challengesDone
              : [...s.challengesDone, challenge.id],
            xp: s.xp + challenge.xp,
            xpLog: [
              { at: new Date().toISOString(), amount: challenge.xp, sourceKey: challenge.titleKey },
              ...s.xpLog,
            ].slice(0, 200),
          };
        });
        if (completedNewChallenge) requestStoreReviewAfterTask();
      },

      // XP/score/streak sesji RO! idą przez completeTask; tu tylko statystyki.
      completeRoSession: (accuracy) => {
        set((s) => ({
          roSessionsCompleted: s.roSessionsCompleted + 1,
          roBestAccuracy: Math.max(s.roBestAccuracy, accuracy),
        }));
        requestStoreReviewAfterTask();
      },

      completeMusicSession: (date) => {
        let completedNewSession = false;
        set((s) => {
          if (s.musicLastCompletedDate === date) return s;
          completedNewSession = true;
          return {
            musicSessionsCompleted: (s.musicSessionsCompleted ?? 0) + 1,
            musicLastCompletedDate: date,
          };
        });
        if (completedNewSession) requestStoreReviewAfterTask();
      },
    }),
    {
      name: 'progress',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
