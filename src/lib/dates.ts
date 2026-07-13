/** Local-timezone yyyy-mm-dd key used across history/streak records. */
export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Monday-first index of the week day (0 = Monday … 6 = Sunday). */
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function startOfWeek(date: Date = new Date()): Date {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(date.getDate() - mondayIndex(date));
  return monday;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(date.getMonth() + months);
  return next;
}

export function lastNDays(count: number, today: Date = new Date()): string[] {
  return Array.from({ length: count }, (_, index) => {
    return dateKey(addDays(today, index - count + 1));
  });
}

/** Keys for the current week, Monday through Sunday. */
export function currentWeekKeys(today: Date = new Date()): string[] {
  const monday = startOfWeek(today);
  return Array.from({ length: 7 }, (_, i) => {
    return dateKey(addDays(monday, i));
  });
}
