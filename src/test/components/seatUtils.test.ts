import { describe, expect, it } from 'vitest';
import { calculateTotalPrice, isSeatSelectable } from '../../components/seatUtils';
import { mockSeats } from '../../mocks/mockData';

describe('seatUtils', () => {
  it('maps seat status to selectability', () => {
    expect(isSeatSelectable('AVAILABLE')).toBe(true);
    expect(isSeatSelectable('BOOKED')).toBe(false);
    expect(isSeatSelectable('SOLD')).toBe(false);
  });

  it('calculates total selected price', () => {
    expect(calculateTotalPrice([mockSeats[1], mockSeats[2]])).toBe(300000);
  });
});
