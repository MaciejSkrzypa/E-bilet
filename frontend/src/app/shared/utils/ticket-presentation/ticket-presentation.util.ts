import { TicketOfferResponse, TicketResponse, TicketType } from '../../../core/models/api/api.models';

export type TicketStatusTone = 'neutral' | 'warning' | 'success' | 'danger';

export interface TicketStatus {
  label: string;
  tone: TicketStatusTone;
}

type TicketTitleSource = Pick<TicketResponse, 'type' | 'fare' | 'durationMinutes'>;
type TicketValidationSource = Pick<TicketResponse, 'type' | 'validatedAt'>;

export function getTicketTypeLabel(type: TicketType): string {
  if (type === 'SINGLE') {
    return 'Jednorazowy';
  }

  if (type === 'TIME') {
    return 'Czasowy';
  }

  return 'Okresowy';
}

export function getTicketStatus(ticket: TicketResponse, referenceDate = new Date()): TicketStatus {
  if (ticket.type === 'PERIOD') {
    if (!ticket.validFrom || !ticket.validTo) {
      return { label: 'Niepelna konfiguracja biletu okresowego', tone: 'danger' };
    }

    const referenceDateLabel = toDateOnlyValue(referenceDate);

    if (referenceDateLabel < ticket.validFrom) {
      return { label: 'Oczekuje na rozpoczecie waznosci', tone: 'warning' };
    }

    if (referenceDateLabel > ticket.validTo) {
      return { label: 'Bilet okresowy wygasl', tone: 'danger' };
    }

    return { label: 'Bilet okresowy jest aktywny', tone: 'success' };
  }

  if (!ticket.validatedAt) {
    return { label: 'Wymaga kasowania', tone: 'warning' };
  }

  if (ticket.type === 'SINGLE') {
    return { label: 'Skasowany w pojezdzie', tone: 'success' };
  }

  if (!ticket.durationMinutes) {
    return { label: 'Brak czasu waznosci', tone: 'danger' };
  }

  const expiresAt = new Date(ticket.validatedAt);
  expiresAt.setMinutes(expiresAt.getMinutes() + ticket.durationMinutes);

  if (referenceDate > expiresAt) {
    return { label: 'Bilet czasowy wygasl', tone: 'danger' };
  }

  return { label: `Skasowany, aktywny do ${expiresAt.toLocaleString()}`, tone: 'success' };
}

export function canTicketBeValidated(ticket: TicketValidationSource): boolean {
  return ticket.type !== 'PERIOD' && !ticket.validatedAt;
}

export function computePeriodTicketPrice(
  offer: TicketOfferResponse,
  validFrom: string | null,
  validTo: string | null,
): number | null {
  if (offer.type !== 'PERIOD' || !validFrom || !validTo) {
    return null;
  }

  const start = new Date(`${validFrom}T00:00:00`);
  const end = new Date(`${validTo}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return null;
  }

  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.round(offer.price * diffDays * 100) / 100;
}

export function getOfferTitle(offer: TicketOfferResponse): string {
  return buildTicketTitle(offer);
}

export function getTicketTitle(ticket: TicketResponse): string {
  return buildTicketTitle(ticket);
}

export function getOfferPriceCaption(offer: TicketOfferResponse): string | null {
  if (offer.type === 'PERIOD') {
    return 'za dzien';
  }

  return null;
}

function buildTicketTitle(source: TicketTitleSource): string {
  if (source.type === 'SINGLE') {
    return source.fare === 'NORMAL' ? 'Bilet jednorazowy normalny' : 'Bilet jednorazowy ulgowy';
  }

  if (source.type === 'TIME') {
    return `${source.durationMinutes}-minutowy ${source.fare === 'NORMAL' ? 'normalny' : 'ulgowy'}`;
  }

  return `Bilet okresowy ${source.fare === 'NORMAL' ? 'normalny' : 'ulgowy'}`;
}

function toDateOnlyValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
