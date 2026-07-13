import type { ProtocolModule } from '@/features/protocol/protocol';

export type ChallengeCategory = 'forest' | 'water' | 'fire' | 'winter';

export type NatureChallenge = {
  id: string;
  category: ChallengeCategory;
  module: ProtocolModule;
  titleKey: string;
  subtitleKey: string;
  detailKey: string;
  xp: number;
  minutes: number;
};

export const NATURE_CHALLENGES: NatureChallenge[] = [
  {
    id: 'forest-hour',
    category: 'forest',
    module: 'nature',
    titleKey: 'challenges.forestHour.title',
    subtitleKey: 'challenges.forestHour.subtitle',
    detailKey: 'challenges.forestHour.detail',
    xp: 45,
    minutes: 60,
  },
  {
    id: 'sunrise-walk',
    category: 'forest',
    module: 'nature',
    titleKey: 'challenges.sunriseWalk.title',
    subtitleKey: 'challenges.sunriseWalk.subtitle',
    detailKey: 'challenges.sunriseWalk.detail',
    xp: 35,
    minutes: 30,
  },
  {
    id: 'barefoot-sensory-walk',
    category: 'forest',
    module: 'nature',
    titleKey: 'challenges.barefootSensoryWalk.title',
    subtitleKey: 'challenges.barefootSensoryWalk.subtitle',
    detailKey: 'challenges.barefootSensoryWalk.detail',
    xp: 20,
    minutes: 10,
  },
  {
    id: 'cold-water-face',
    category: 'water',
    module: 'cold',
    titleKey: 'challenges.coldWaterFace.title',
    subtitleKey: 'challenges.coldWaterFace.subtitle',
    detailKey: 'challenges.coldWaterFace.detail',
    xp: 15,
    minutes: 2,
  },
  {
    id: 'lake-dip',
    category: 'water',
    module: 'cold',
    titleKey: 'challenges.lakeDip.title',
    subtitleKey: 'challenges.lakeDip.subtitle',
    detailKey: 'challenges.lakeDip.detail',
    xp: 20,
    minutes: 10,
  },
  {
    id: 'fire-evening',
    category: 'fire',
    module: 'nature',
    titleKey: 'challenges.fireEvening.title',
    subtitleKey: 'challenges.fireEvening.subtitle',
    detailKey: 'challenges.fireEvening.detail',
    xp: 25,
    minutes: 30,
  },
  {
    id: 'snow-walk',
    category: 'winter',
    module: 'nature',
    titleKey: 'challenges.snowWalk.title',
    subtitleKey: 'challenges.snowWalk.subtitle',
    detailKey: 'challenges.snowWalk.detail',
    xp: 40,
    minutes: 20,
  },
  {
    id: 'phone-free-trail',
    category: 'forest',
    module: 'nature',
    titleKey: 'challenges.phoneFreeTrail.title',
    subtitleKey: 'challenges.phoneFreeTrail.subtitle',
    detailKey: 'challenges.phoneFreeTrail.detail',
    xp: 55,
    minutes: 60,
  },
  {
    id: 'sit-spot',
    category: 'forest',
    module: 'nature',
    titleKey: 'challenges.sitSpot.title',
    subtitleKey: 'challenges.sitSpot.subtitle',
    detailKey: 'challenges.sitSpot.detail',
    xp: 25,
    minutes: 20,
  },
  {
    id: 'rain-walk',
    category: 'winter',
    module: 'nature',
    titleKey: 'challenges.rainWalk.title',
    subtitleKey: 'challenges.rainWalk.subtitle',
    detailKey: 'challenges.rainWalk.detail',
    xp: 30,
    minutes: 20,
  },
  {
    id: 'shoreline-observation',
    category: 'water',
    module: 'nature',
    titleKey: 'challenges.shorelineObservation.title',
    subtitleKey: 'challenges.shorelineObservation.subtitle',
    detailKey: 'challenges.shorelineObservation.detail',
    xp: 35,
    minutes: 30,
  },
  {
    id: 'leave-no-trace',
    category: 'forest',
    module: 'nature',
    titleKey: 'challenges.leaveNoTrace.title',
    subtitleKey: 'challenges.leaveNoTrace.subtitle',
    detailKey: 'challenges.leaveNoTrace.detail',
    xp: 35,
    minutes: 30,
  },
];

const DAILY_CATEGORY_PATTERN: ChallengeCategory[][] = [
  ['forest', 'water', 'fire'],
  ['forest', 'winter', 'water'],
  ['forest', 'forest', 'water'],
  ['winter', 'forest', 'fire'],
  ['water', 'forest', 'winter'],
  ['forest', 'water', 'forest'],
  ['fire', 'forest', 'winter'],
];

function localDaySeed(date: Date): number {
  return Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86_400_000);
}

export function dailyNatureChallenges(date: Date = new Date()): NatureChallenge[] {
  const seed = localDaySeed(date);
  const pattern = DAILY_CATEGORY_PATTERN[seed % DAILY_CATEGORY_PATTERN.length];
  const selected: NatureChallenge[] = [];

  for (const [index, category] of pattern.entries()) {
    const bucket = NATURE_CHALLENGES.filter((challenge) => challenge.category === category);
    const challenge = bucket[(seed + index) % bucket.length];
    if (challenge && !selected.some((item) => item.id === challenge.id)) {
      selected.push(challenge);
    }
  }

  for (const challenge of NATURE_CHALLENGES) {
    if (selected.length >= 3) break;
    if (!selected.some((item) => item.id === challenge.id)) selected.push(challenge);
  }

  return selected;
}

export function challengeById(id: string | undefined) {
  return NATURE_CHALLENGES.find((challenge) => challenge.id === id);
}
