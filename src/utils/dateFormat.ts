function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function toDateParts(date: Date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: pad2(date.getHours()),
    minute: pad2(date.getMinutes()),
  };
}

export function formatDotDateTime(value: string): string {
  const date = new Date(value);
  const { year, month, day, hour, minute } = toDateParts(date);
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

export function formatDotDateTimeRange(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const startParts = toDateParts(start);
  const endParts = toDateParts(end);

  const sameDay =
    startParts.year === endParts.year &&
    startParts.month === endParts.month &&
    startParts.day === endParts.day;

  const startText = `${startParts.year}.${startParts.month}.${startParts.day} ${startParts.hour}:${startParts.minute}`;
  if (sameDay) {
    return `${startText} ~ ${endParts.hour}:${endParts.minute}`;
  }

  const endText = `${endParts.year}.${endParts.month}.${endParts.day} ${endParts.hour}:${endParts.minute}`;
  return `${startText} ~ ${endText}`;
}
