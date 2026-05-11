import { TicketOfferResponse, TicketResponse } from '../../../core/models/api/api.models';
import {
  canTicketBeValidated,
  computePeriodTicketPrice,
  getOfferPriceCaption,
  getOfferTitle,
  getTicketStatus,
  getTicketTitle,
  getTicketTypeLabel,
} from './ticket-presentation.util';

describe('ticket presentation util', () => {
  const baseTicket: TicketResponse = {
    id: 1,
    code: '123e4567-e89b-12d3-a456-426614174000',
    type: 'SINGLE',
    fare: 'NORMAL',
    price: 4.4,
    purchaseDate: '2026-05-09T10:00:00',
    durationMinutes: null,
    validFrom: null,
    validTo: null,
    validatedAt: null,
    validatedVehicleId: null,
    validatedVehicleLabel: null,
  };

  it('should classify single ticket without validation', () => {
    expect(getTicketStatus(baseTicket)).toEqual({
      label: 'Wymaga kasowania',
      tone: 'warning',
    });
  });

  it('should classify active period ticket', () => {
    const ticket: TicketResponse = {
      ...baseTicket,
      type: 'PERIOD',
      validFrom: '2026-05-09',
      validTo: '2026-05-12',
    };

    const status = getTicketStatus(ticket, new Date('2026-05-09T10:00:00'));
    expect(status.tone).toBe('success');
  });

  it('should classify upcoming or expired period ticket', () => {
    const ticket: TicketResponse = {
      ...baseTicket,
      type: 'PERIOD',
      validFrom: '2026-05-09',
      validTo: '2026-05-12',
    };

    expect(getTicketStatus(ticket, new Date('2026-05-08T08:00:00')).tone).toBe('warning');
    expect(getTicketStatus(ticket, new Date('2026-05-13T13:00:00')).tone).toBe('danger');
  });

  it('should classify validated single and time tickets', () => {
    const singleTicket: TicketResponse = {
      ...baseTicket,
      validatedAt: '2026-05-09T10:02:00',
      validatedVehicleId: 1,
      validatedVehicleLabel: 'T-100',
    };
    const activeTimeTicket: TicketResponse = {
      ...baseTicket,
      type: 'TIME',
      durationMinutes: 30,
      validatedAt: '2026-05-09T10:00:00',
    };
    const expiredTimeTicket: TicketResponse = {
      ...activeTimeTicket,
      validatedAt: '2026-05-09T09:00:00',
    };

    expect(getTicketStatus(singleTicket, new Date('2026-05-09T12:00:00'))).toEqual({
      label: 'Skasowany w pojezdzie',
      tone: 'success',
    });
    expect(getTicketStatus(singleTicket, new Date('2026-05-10T08:00:00'))).toEqual({
      label: 'Bilet jednorazowy wygasl',
      tone: 'danger',
    });

    const activeTimeStatus = getTicketStatus(activeTimeTicket, new Date('2026-05-09T10:10:00'));
    expect(activeTimeStatus.tone).toBe('success');
    expect(activeTimeStatus.label).toContain('Skasowany, aktywny do');

    expect(getTicketStatus(expiredTimeTicket, new Date('2026-05-09T10:00:00')).tone).toBe('danger');
  });

  it('should treat backend time ticket timestamps as local application time', () => {
    const justValidatedTimeTicket: TicketResponse = {
      ...baseTicket,
      type: 'TIME',
      durationMinutes: 60,
      validatedAt: '2026-05-10T12:00:00',
    };

    expect(getTicketStatus(justValidatedTimeTicket, new Date('2026-05-10T12:30:00')).tone).toBe('success');
    expect(getTicketStatus(justValidatedTimeTicket, new Date('2026-05-10T13:30:01')).tone).toBe('danger');
  });

  it('should classify inconsistent tickets', () => {
    expect(
      getTicketStatus({
        ...baseTicket,
        type: 'PERIOD',
      }),
    ).toEqual({
      label: 'Niepelna konfiguracja biletu okresowego',
      tone: 'danger',
    });

    expect(
      getTicketStatus({
        ...baseTicket,
        type: 'TIME',
        validatedAt: '2026-05-09T10:00:00',
        durationMinutes: null,
      }),
    ).toEqual({
      label: 'Brak czasu waznosci',
      tone: 'danger',
    });
  });

  it('should compute period ticket price', () => {
    const offer: TicketOfferResponse = {
      id: 3,
      type: 'PERIOD',
      fare: 'NORMAL',
      price: 5,
      durationMinutes: null,
    };

    expect(computePeriodTicketPrice(offer, '2026-05-09', '2026-05-15')).toBe(35);
  });

  it('should return null when period price cannot be computed', () => {
    const periodOffer: TicketOfferResponse = {
      id: 3,
      type: 'PERIOD',
      fare: 'NORMAL',
      price: 5,
      durationMinutes: null,
    };
    const singleOffer: TicketOfferResponse = {
      id: 4,
      type: 'SINGLE',
      fare: 'NORMAL',
      price: 4.4,
      durationMinutes: null,
    };

    expect(computePeriodTicketPrice(periodOffer, '2026-05-10', '2026-05-09')).toBeNull();
    expect(computePeriodTicketPrice(singleOffer, '2026-05-09', '2026-05-10')).toBeNull();
  });

  it('should generate offer title', () => {
    expect(
      getOfferTitle({
        id: 1,
        type: 'TIME',
        fare: 'REDUCED',
        price: 1.7,
        durationMinutes: 30,
      }),
    ).toContain('30-minutowy');

    expect(
      getOfferTitle({
        id: 2,
        type: 'SINGLE',
        fare: 'REDUCED',
        price: 2.2,
        durationMinutes: null,
      }),
    ).toContain('ulgowy');

    expect(
      getOfferTitle({
        id: 5,
        type: 'PERIOD',
        fare: 'NORMAL',
        price: 5,
        durationMinutes: null,
      }),
    ).toContain('okresowy');
  });

  it('should generate ticket title using the same naming as offers', () => {
    expect(
      getTicketTitle({
        ...baseTicket,
        type: 'TIME',
        fare: 'REDUCED',
        durationMinutes: 30,
      }),
    ).toBe('30-minutowy ulgowy');

    expect(
      getTicketTitle({
        ...baseTicket,
        type: 'SINGLE',
        fare: 'NORMAL',
      }),
    ).toBe('Bilet jednorazowy normalny');
  });

  it('should map ticket type labels to Polish names', () => {
    expect(getTicketTypeLabel('SINGLE')).toBe('Jednorazowy');
    expect(getTicketTypeLabel('TIME')).toBe('Czasowy');
    expect(getTicketTypeLabel('PERIOD')).toBe('Okresowy');
  });

  it('should determine whether ticket can be validated', () => {
    expect(canTicketBeValidated(baseTicket)).toBe(true);
    expect(
      canTicketBeValidated({
        ...baseTicket,
        validatedAt: '2026-05-09T10:00:00',
      }),
    ).toBe(false);
    expect(
      canTicketBeValidated({
        ...baseTicket,
        type: 'PERIOD',
      }),
    ).toBe(false);
  });

  it('should return price caption only for period offers', () => {
    expect(
      getOfferPriceCaption({
        id: 5,
        type: 'PERIOD',
        fare: 'NORMAL',
        price: 5,
        durationMinutes: null,
      }),
    ).toBe('za dzien');

    expect(
      getOfferPriceCaption({
        id: 1,
        type: 'TIME',
        fare: 'NORMAL',
        price: 4.4,
        durationMinutes: 20,
      }),
    ).toBeNull();
  });
});
