import { EventResponse, SeatResponse } from '../api/contracts';

export const mockEvent: EventResponse = {
  id: 1,
  title: 'IU Live in Seoul',
  category: 'CONCERT',
  startAt: '2026-05-01T19:00:00',
  endAt: '2026-05-01T22:00:00',
  venue: 'Jamsil Main Stadium',
};

export const mockSeats: SeatResponse[] = [
  { id: 1, event: mockEvent, seatNumber: 'A1', price: 150000, status: 'BOOKED' },
  { id: 2, event: mockEvent, seatNumber: 'A2', price: 150000, status: 'AVAILABLE' },
  { id: 3, event: mockEvent, seatNumber: 'A3', price: 150000, status: 'AVAILABLE' },
  { id: 4, event: mockEvent, seatNumber: 'B1', price: 120000, status: 'BOOKED' },
  { id: 5, event: mockEvent, seatNumber: 'B2', price: 120000, status: 'AVAILABLE' },
  { id: 6, event: mockEvent, seatNumber: 'B3', price: 120000, status: 'AVAILABLE' },
  { id: 7, event: mockEvent, seatNumber: 'C1', price: 90000, status: 'AVAILABLE' },
  { id: 8, event: mockEvent, seatNumber: 'C2', price: 90000, status: 'BOOKED' },
];
