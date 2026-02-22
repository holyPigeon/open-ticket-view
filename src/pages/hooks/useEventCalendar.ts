import { useEffect, useMemo, useState } from 'react';
import { EventResponse } from '../../api/contracts';
import { buildMonthCells, isDateInRange, isSameDay, startOfDay } from '../eventDetail.utils';

type EventDateRange = {
  start: Date;
  end: Date;
};

type UseEventCalendarInput = {
  event: EventResponse | null;
};

type UseEventCalendarOutput = {
  eventDateRange: EventDateRange | null;
  isSingleDayEvent: boolean;
  viewMonth: Date | null;
  calendarDays: Date[];
  selectedDate: Date | null;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  selectDate: (day: Date) => void;
};

export function useEventCalendar(input: UseEventCalendarInput): UseEventCalendarOutput {
  const { event } = input;
  const [calendarMonth, setCalendarMonth] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const eventDateRange = useMemo(() => {
    if (!event) {
      return null;
    }

    const startDate = startOfDay(new Date(event.startAt));
    const endDate = startOfDay(new Date(event.endAt));
    const start = startDate.getTime() <= endDate.getTime() ? startDate : endDate;
    const end = startDate.getTime() <= endDate.getTime() ? endDate : startDate;
    return { start, end };
  }, [event]);

  useEffect(() => {
    if (!eventDateRange) {
      return;
    }

    setCalendarMonth(new Date(eventDateRange.start.getFullYear(), eventDateRange.start.getMonth(), 1));
    setSelectedDate(eventDateRange.start);
  }, [eventDateRange]);

  const isSingleDayEvent = useMemo(() => {
    if (!eventDateRange) {
      return false;
    }

    return isSameDay(eventDateRange.start, eventDateRange.end);
  }, [eventDateRange]);

  const viewMonth = useMemo(() => {
    if (!eventDateRange) {
      return null;
    }

    return calendarMonth ?? new Date(eventDateRange.start.getFullYear(), eventDateRange.start.getMonth(), 1);
  }, [calendarMonth, eventDateRange]);

  const calendarDays = useMemo(() => {
    if (!viewMonth) {
      return [];
    }

    return buildMonthCells(viewMonth);
  }, [viewMonth]);

  function goToPreviousMonth() {
    if (!viewMonth) {
      return;
    }

    setCalendarMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    if (!viewMonth) {
      return;
    }

    setCalendarMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  }

  function selectDate(day: Date) {
    if (!eventDateRange || isSingleDayEvent || !isDateInRange(day, eventDateRange.start, eventDateRange.end)) {
      return;
    }

    setSelectedDate(day);
  }

  return {
    eventDateRange,
    isSingleDayEvent,
    viewMonth,
    calendarDays,
    selectedDate,
    goToPreviousMonth,
    goToNextMonth,
    selectDate,
  };
}
