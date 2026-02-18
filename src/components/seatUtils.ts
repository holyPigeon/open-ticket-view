import { SeatResponse } from '../api/contracts';

export function isSeatSelectable(status: string): boolean {
  return status === 'AVAILABLE';
}

export function calculateTotalPrice(seats: SeatResponse[]): number {
  return seats.reduce((sum, seat) => sum + seat.price, 0);
}

export function groupSeatsByRow(seats: SeatResponse[]): Record<string, SeatResponse[]> {
  return seats.reduce<Record<string, SeatResponse[]>>((acc, seat) => {
    const row = seat.seatNumber.charAt(0).toUpperCase() || 'OTHER';
    if (!acc[row]) {
      acc[row] = [];
    }
    acc[row].push(seat);
    return acc;
  }, {});
}
