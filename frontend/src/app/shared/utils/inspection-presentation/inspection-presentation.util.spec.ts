import { getInspectionReasonLabel } from './inspection-presentation.util';

describe('inspection presentation util', () => {
  it('should translate exact inspection reasons to Polish', () => {
    expect(getInspectionReasonLabel('Ticket not found')).toBe('Nie znaleziono biletu.');
    expect(getInspectionReasonLabel('Period ticket within validity range')).toBe(
      'Bilet okresowy jest ważny w dniu kontroli.',
    );
    expect(getInspectionReasonLabel('Single ticket expired: validation day has passed')).toBe(
      'Bilet jednorazowy jest ważny tylko w dniu skasowania.',
    );
    expect(getInspectionReasonLabel('Ticket has not been validated (kasowanie missing)')).toBe(
      'Bilet nie został skasowany.',
    );
  });

  it('should translate vehicle mismatch reason', () => {
    expect(getInspectionReasonLabel('Single ticket validated in a different vehicle (T-101)')).toBe(
      'Bilet jednorazowy został skasowany w innym pojeździe (T-101).',
    );
  });

  it('should translate time ticket reasons and format local date time', () => {
    expect(getInspectionReasonLabel('Time ticket expired at 2026-05-10T02:25:12.035492')).toBe(
      'Bilet czasowy wygasł o 10.05.2026, 02:25.',
    );
    expect(getInspectionReasonLabel('Time ticket valid until 2026-05-10T14:05:00')).toBe(
      'Bilet czasowy jest ważny do 10.05.2026, 14:05.',
    );
  });

  it('should keep unknown reason readable', () => {
    expect(getInspectionReasonLabel('Custom backend message')).toBe('Custom backend message.');
  });
});
