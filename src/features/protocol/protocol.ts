import type { SFSymbol } from 'expo-symbols';

import type { Theme } from '@/constants/theme';
import { coldDurationSeconds } from '@/features/cold/plan';
import type { Profile } from '@/stores/profile';

export type ProtocolModule = 'cold' | 'sauna' | 'nature' | 'diet' | 'breath' | 'ro' | 'music';

export type ProtocolTask = {
  /** Stable within a day; used as the id in DayRecord.tasksDone. */
  id: string;
  module: ProtocolModule;
  titleKey: string;
  metaKey?: 'meta.seconds' | 'meta.minutes';
  metaCount?: number;
  xp: number;
  /** Minutes credited to module stats when completed. */
  minutes?: number;
  /** Opens a guided timer session instead of a plain checkbox. */
  session?: 'cold' | 'sauna' | 'breath' | 'ro' | 'music';
};

type TaskKind =
  | 'cold'
  | 'sauna'
  | 'ro'
  | 'kygoJo'
  | 'breathSlow'
  | 'breathReset'
  | 'natureShort'
  | 'natureStandard'
  | 'natureLong'
  | 'daylightWalk'
  | 'phoneFreeNature'
  | 'sitSpot'
  | 'sensoryWalk'
  | 'weatherWalk'
  | 'wholeGrain'
  | 'berriesVeg'
  | 'legumes'
  | 'fishOrLegumes'
  | 'vegetableHalfPlate'
  | 'nutsSeeds'
  | 'wholeFoodMeal'
  | 'processedSwap'
  | 'mealPrep';

export type ProtocolPlanDay = {
  day: number;
  focusKey: string;
  tasks: readonly TaskKind[];
};

const DEFAULT_PROFILE: Profile = {
  goals: ['energy', 'resilience'],
  coldLevel: 'never',
  saunaAccess: 'occasional',
  natureAccess: 'park',
  diet: 'mixed',
};

/**
 * Editorial habit rotation. Individual practices draw on evidence and safety
 * guidance, but this exact order and frequency are product choices, not an
 * experimentally validated medical protocol.
 */
export const PROTOCOL_30_DAY_PLAN: readonly ProtocolPlanDay[] = [
  { day: 1, focusKey: 'protocolPlan.focus.baseline', tasks: ['cold', 'natureStandard', 'wholeGrain', 'ro'] },
  { day: 2, focusKey: 'protocolPlan.focus.daylight', tasks: ['cold', 'daylightWalk', 'berriesVeg', 'breathSlow'] },
  { day: 3, focusKey: 'protocolPlan.focus.heat', tasks: ['sauna', 'natureShort', 'vegetableHalfPlate'] },
  { day: 4, focusKey: 'protocolPlan.focus.foodFiber', tasks: ['cold', 'sitSpot', 'legumes'] },
  { day: 5, focusKey: 'protocolPlan.focus.unplug', tasks: ['cold', 'phoneFreeNature', 'wholeFoodMeal', 'breathReset', 'ro'] },
  { day: 6, focusKey: 'protocolPlan.focus.heat', tasks: ['sauna', 'sensoryWalk', 'fishOrLegumes'] },
  { day: 7, focusKey: 'protocolPlan.focus.longOutdoor', tasks: ['cold', 'natureLong', 'mealPrep'] },
  { day: 8, focusKey: 'protocolPlan.focus.recovery', tasks: ['natureStandard', 'wholeGrain', 'breathSlow'] },
  { day: 9, focusKey: 'protocolPlan.focus.weather', tasks: ['cold', 'weatherWalk', 'berriesVeg', 'ro'] },
  { day: 10, focusKey: 'protocolPlan.focus.heat', tasks: ['sauna', 'daylightWalk', 'nutsSeeds'] },
  { day: 11, focusKey: 'protocolPlan.focus.natureVolume', tasks: ['cold', 'natureStandard', 'legumes', 'breathReset'] },
  { day: 12, focusKey: 'protocolPlan.focus.calm', tasks: ['sitSpot', 'vegetableHalfPlate', 'breathSlow'] },
  { day: 13, focusKey: 'protocolPlan.focus.heat', tasks: ['sauna', 'phoneFreeNature', 'wholeFoodMeal', 'ro'] },
  { day: 14, focusKey: 'protocolPlan.focus.longOutdoor', tasks: ['cold', 'natureLong', 'fishOrLegumes', 'kygoJo'] },
  { day: 15, focusKey: 'protocolPlan.focus.sensory', tasks: ['cold', 'sensoryWalk', 'wholeGrain'] },
  { day: 16, focusKey: 'protocolPlan.focus.recovery', tasks: ['natureShort', 'berriesVeg', 'breathReset'] },
  { day: 17, focusKey: 'protocolPlan.focus.heat', tasks: ['sauna', 'natureStandard', 'vegetableHalfPlate', 'ro'] },
  { day: 18, focusKey: 'protocolPlan.focus.daylight', tasks: ['daylightWalk', 'legumes', 'breathSlow'] },
  { day: 19, focusKey: 'protocolPlan.focus.weather', tasks: ['cold', 'weatherWalk', 'nutsSeeds', 'breathSlow'] },
  { day: 20, focusKey: 'protocolPlan.focus.heat', tasks: ['sauna', 'sitSpot', 'wholeFoodMeal'] },
  { day: 21, focusKey: 'protocolPlan.focus.longOutdoor', tasks: ['natureLong', 'mealPrep', 'breathSlow', 'ro'] },
  { day: 22, focusKey: 'protocolPlan.focus.baseline', tasks: ['cold', 'natureStandard', 'wholeGrain', 'breathReset'] },
  { day: 23, focusKey: 'protocolPlan.focus.unplug', tasks: ['cold', 'phoneFreeNature', 'berriesVeg'] },
  { day: 24, focusKey: 'protocolPlan.focus.heat', tasks: ['sauna', 'sensoryWalk', 'fishOrLegumes', 'breathReset'] },
  { day: 25, focusKey: 'protocolPlan.focus.natureVolume', tasks: ['natureStandard', 'vegetableHalfPlate', 'breathSlow', 'ro'] },
  { day: 26, focusKey: 'protocolPlan.focus.foodFiber', tasks: ['cold', 'weatherWalk', 'legumes'] },
  { day: 27, focusKey: 'protocolPlan.focus.heat', tasks: ['sauna', 'daylightWalk', 'nutsSeeds', 'breathReset'] },
  { day: 28, focusKey: 'protocolPlan.focus.longOutdoor', tasks: ['cold', 'natureLong', 'wholeFoodMeal', 'kygoJo'] },
  { day: 29, focusKey: 'protocolPlan.focus.calm', tasks: ['sitSpot', 'processedSwap', 'breathReset', 'ro'] },
  { day: 30, focusKey: 'protocolPlan.focus.consolidate', tasks: ['sauna', 'phoneFreeNature', 'mealPrep', 'breathSlow'] },
] as const;

const PROTOCOL_EPOCH_UTC = Date.UTC(2026, 0, 1);

/** Day 1 starts on 2026-01-01 and the evidence-informed rotation repeats every 30 local dates. */
export function protocolCycleDay(date: Date = new Date()): number {
  const localDateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const elapsedDays = Math.round((localDateUtc - PROTOCOL_EPOCH_UTC) / 86_400_000);
  return ((elapsedDays % PROTOCOL_30_DAY_PLAN.length) + PROTOCOL_30_DAY_PLAN.length) % PROTOCOL_30_DAY_PLAN.length + 1;
}

function timedTask(
  id: string,
  module: ProtocolModule,
  titleKey: string,
  minutes: number,
  xp: number,
): ProtocolTask {
  return { id, module, titleKey, metaKey: 'meta.minutes', metaCount: minutes, minutes, xp };
}

function buildTask(kind: TaskKind, profile: Profile, coldPlanDay: number): ProtocolTask {
  switch (kind) {
    case 'cold': {
      const seconds = coldDurationSeconds(coldPlanDay);
      return {
        id: 'cold',
        module: 'cold',
        titleKey: 'protocol.cold',
        metaKey: 'meta.seconds',
        metaCount: seconds,
        xp: 30,
        minutes: Math.max(1, Math.round(seconds / 60)),
        session: 'cold',
      };
    }
    case 'sauna':
      if (profile.saunaAccess === 'no') {
        return {
          ...timedTask('heat-alternative', 'breath', 'protocol.breathRecovery', 8, 18),
          session: 'breath',
        };
      }
      return {
        id: 'sauna',
        module: 'sauna',
        titleKey: 'protocol.sauna',
        xp: 30,
        session: 'sauna',
      };
    case 'ro':
      // Viking Row (ro-activity.md) — user jest bębniarzem, tłum odpowiada RO!
      return {
        id: 'ro',
        module: 'ro',
        titleKey: 'protocol.ro',
        metaKey: 'meta.seconds',
        metaCount: 15,
        xp: 25,
        session: 'ro',
      };
    case 'kygoJo':
      return {
        id: 'kygo-jo',
        module: 'music',
        titleKey: 'protocol.kygoJo',
        metaKey: 'meta.seconds',
        metaCount: 153,
        xp: 15,
        session: 'music',
      };
    case 'breathSlow':
      return {
        ...timedTask('breath-slow', 'breath', 'protocol.breathSlow', 5, 15),
        session: 'breath',
      };
    case 'breathReset':
      return {
        ...timedTask('breath-reset', 'breath', 'protocol.breathReset', 6, 15),
        session: 'breath',
      };
    case 'natureShort':
      return timedTask('nature-short', 'nature', 'protocol.natureTime', 15, 18);
    case 'natureStandard':
      return timedTask('nature-standard', 'nature', 'protocol.natureTime', 25, 25);
    case 'natureLong':
      return timedTask('nature-long', 'nature', 'protocol.natureLong', 50, 40);
    case 'daylightWalk':
      return timedTask('daylight-walk', 'nature', 'protocol.daylightWalk', 20, 22);
    case 'phoneFreeNature':
      return timedTask('phone-free-nature', 'nature', 'protocol.phoneFreeNature', 30, 30);
    case 'sitSpot':
      return timedTask('sit-spot', 'nature', 'protocol.sitSpot', 12, 18);
    case 'sensoryWalk':
      return timedTask('sensory-walk', 'nature', 'protocol.sensoryWalk', 12, 18);
    case 'weatherWalk':
      return timedTask('weather-walk', 'nature', 'protocol.weatherWalk', 25, 25);
    case 'wholeGrain':
      return { id: 'diet-whole-grain', module: 'diet', titleKey: 'protocol.wholeGrain', xp: 20 };
    case 'berriesVeg':
      return { id: 'diet-berries-veg', module: 'diet', titleKey: 'protocol.berriesVeg', xp: 20 };
    case 'legumes':
      return { id: 'diet-legumes', module: 'diet', titleKey: 'protocol.legumes', xp: 20 };
    case 'fishOrLegumes':
      return { id: 'diet-fish-legumes', module: 'diet', titleKey: 'protocol.fishOrLegumes', xp: 20 };
    case 'vegetableHalfPlate':
      return { id: 'diet-vegetable-plate', module: 'diet', titleKey: 'protocol.vegetableHalfPlate', xp: 20 };
    case 'nutsSeeds':
      return { id: 'diet-nuts-seeds', module: 'diet', titleKey: 'protocol.nutsSeeds', xp: 20 };
    case 'wholeFoodMeal':
      return { id: 'diet-whole-food', module: 'diet', titleKey: 'protocol.wholeFoodMeal', xp: 20 };
    case 'processedSwap':
      return { id: 'diet-processed-swap', module: 'diet', titleKey: 'protocol.processedSwap', xp: 20 };
    case 'mealPrep':
      return { id: 'diet-meal-prep', module: 'diet', titleKey: 'protocol.mealPrep', xp: 22 };
  }
}

export function generateDailyProtocol(
  profile: Profile | null,
  coldPlanDay: number,
  date: Date = new Date(),
): ProtocolTask[] {
  const plan = PROTOCOL_30_DAY_PLAN[protocolCycleDay(date) - 1];
  const resolvedProfile = profile ?? DEFAULT_PROFILE;
  return plan.tasks.map((kind) => buildTask(kind, resolvedProfile, coldPlanDay));
}

export function moduleColor(module: ProtocolModule, theme: Theme): string {
  switch (module) {
    case 'cold':
    case 'breath':
      return theme.frost;
    case 'sauna':
      return theme.ember;
    case 'nature':
      return theme.aurora;
    case 'diet':
      return theme.gold;
    case 'ro':
      return theme.blood;
    case 'music':
      return theme.blood;
  }
}

export function moduleSymbol(module: ProtocolModule): SFSymbol {
  switch (module) {
    case 'cold':
      return 'snowflake';
    case 'breath':
      return 'wind';
    case 'sauna':
      return 'flame.fill';
    case 'nature':
      return 'tree.fill';
    case 'diet':
      return 'fork.knife';
    case 'ro':
      return 'figure.rower';
    case 'music':
      return 'music.note';
  }
}
