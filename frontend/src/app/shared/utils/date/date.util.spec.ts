import { formatDateLabel, toDateInputValue } from './date.util';

describe('date util', () => {
  it('should format date for date input', () => {
    expect(toDateInputValue(new Date('2026-05-11T13:45:00.000Z'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should format ISO date label', () => {
    expect(formatDateLabel('1995-04-12')).toBe('12.04.1995');
    expect(formatDateLabel('invalid')).toBe('invalid');
  });
});
