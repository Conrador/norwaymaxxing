export const EAT_KEYS = [
  'diet.eat.fish',
  'diet.eat.wholeGrains',
  'diet.eat.legumes',
  'diet.eat.berries',
  'diet.eat.roots',
  'diet.eat.dairy',
  'diet.eat.nuts',
  'diet.eat.oil',
] as const;

export const AVOID_KEYS = [
  'diet.avoid.highSaltSugar',
  'diet.avoid.processedMeat',
  'diet.avoid.redMeatDaily',
  'diet.avoid.sugar',
  'diet.avoid.saltySnacks',
  'diet.avoid.alcoholDaily',
  'diet.avoid.refinedGrains',
] as const;

export const MEAL_PLAN_IDS = Array.from({ length: 14 }, (_, index) => `day${index + 1}`) as [
  'day1',
  'day2',
  'day3',
  'day4',
  'day5',
  'day6',
  'day7',
  'day8',
  'day9',
  'day10',
  'day11',
  'day12',
  'day13',
  'day14',
];
