export function parseEventDetailId(rawId: string | undefined): number {
  const parsed = Number(rawId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function formatDateRange(startAt: string, endAt: string): string {
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  const start = new Date(startAt).toLocaleString('ko-KR', formatOptions);
  const end = new Date(endAt).toLocaleString('ko-KR', formatOptions);
  return `${start} - ${end}`;
}

export function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function buildMonthCells(baseMonth: Date): Date[] {
  const year = baseMonth.getFullYear();
  const month = baseMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstWeekday = firstDayOfMonth.getDay();
  const firstCellDate = new Date(year, month, 1 - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const cell = new Date(firstCellDate);
    cell.setDate(firstCellDate.getDate() + index);
    return startOfDay(cell);
  });
}

export function formatMonthTitle(date: Date): string {
  return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatSelectedDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}
