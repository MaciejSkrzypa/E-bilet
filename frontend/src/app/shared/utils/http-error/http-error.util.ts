import { HttpErrorResponse } from '@angular/common/http';

import { ApiErrorResponse } from '../../../core/models/api/api.models';

const FIELD_LABELS: Record<string, string> = {
  amount: 'Kwota',
  code: 'Kod biletu',
  dateOfBirth: 'Data urodzenia',
  email: 'Adres e-mail',
  firstName: 'Imie',
  lastName: 'Nazwisko',
  offerId: 'Oferta biletu',
  password: 'Haslo',
  validFrom: 'Data poczatkowa',
  validTo: 'Data koncowa',
  vehicleId: 'Pojazd',
};

const EXACT_MESSAGE_MAP: Record<string, string> = {
  'Access denied: insufficient role for this resource': 'Nie masz uprawnien do tej sekcji.',
  'Amount must be positive': 'Kwota musi byc dodatnia.',
  'Amount too large': 'Kwota jest zbyt duza.',
  'Authentication required: missing or invalid Bearer token': 'Sesja wygasla lub jest nieprawidlowa. Zaloguj sie ponownie.',
  'Constraint violation': 'Przeslane dane sa nieprawidlowe.',
  'Email already registered': 'Konto z tym adresem e-mail juz istnieje.',
  'Inspection vehicle not found': 'Nie znaleziono pojazdu do kontroli.',
  'Invalid credentials': 'Nieprawidlowy adres e-mail lub haslo.',
  'Offer not found': 'Nie znaleziono oferty biletu.',
  'PERIOD tickets do not require validation (no kasowanie)': 'Bilety okresowe nie wymagaja kasowania.',
  'Request validation failed': 'Sprawdz poprawnosc formularza.',
  'Ticket not found': 'Nie znaleziono biletu.',
  'Ticket time fields must match its type': 'Dane waznosci biletu nie zgadzaja sie z jego typem.',
  'User not found': 'Nie znaleziono uzytkownika.',
  'Vehicle not found': 'Nie znaleziono pojazdu.',
  'validFrom and validTo are required for PERIOD tickets': 'Dla biletu okresowego wybierz date poczatkowa i koncowa.',
  'validFrom cannot be in the past': 'Data poczatkowa nie moze byc z przeszlosci.',
  'validFrom must be on or before validTo': 'Data poczatkowa nie moze byc pozniejsza niz data koncowa.',
};

export function getErrorMessage(error: unknown, fallback = 'Wystapil nieoczekiwany blad.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Nie udalo sie polaczyc z serwisem. Sprobuj ponownie za chwile.';
    }

    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return normalizeBackendMessage(error.error);
    }

    if (error.error && typeof error.error === 'object') {
      const problem = error.error as ApiErrorResponse;

      if (Array.isArray(problem.errors)) {
        const validationMessage = formatValidationMessages(problem.errors);
        if (validationMessage !== null) {
          return validationMessage;
        }
      }

      if (typeof problem.message === 'string' && problem.message.trim().length > 0) {
        return normalizeBackendMessage(problem.message);
      }

      if (typeof problem.error === 'string' && problem.error.trim().length > 0) {
        return normalizeBackendMessage(problem.error);
      }
    }

    return getStatusFallback(error.status);
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function formatValidationMessages(errors: string[]): string | null {
  const messages = errors
    .map((error) => formatValidationMessage(error))
    .filter((message, index, array) => message.length > 0 && array.indexOf(message) === index);

  if (messages.length === 0) {
    return null;
  }

  if (messages.length === 1) {
    return messages[0];
  }

  return messages.map((message) => `• ${message}`).join('\n');
}

function formatValidationMessage(message: string): string {
  const trimmedMessage = message.trim();
  const separatorIndex = trimmedMessage.indexOf(':');

  if (separatorIndex === -1) {
    return normalizeBackendMessage(trimmedMessage);
  }

  const rawField = trimmedMessage.slice(0, separatorIndex).trim();
  const rawConstraint = trimmedMessage.slice(separatorIndex + 1).trim();

  const field = rawField.split('.').at(-1) ?? rawField;
  const fieldLabel = FIELD_LABELS[field] ?? rawField;
  const constraint = normalizeConstraintMessage(rawConstraint);

  return `${fieldLabel}: ${constraint}`;
}

function normalizeConstraintMessage(message: string): string {
  const trimmedMessage = message.trim();

  if (trimmedMessage === 'must be a past date') {
    return 'musi wskazywac date z przeszlosci.';
  }

  if (trimmedMessage === 'must not be blank' || trimmedMessage === 'must not be null') {
    return 'jest wymagane.';
  }

  if (trimmedMessage === 'must be a well-formed email address' || trimmedMessage === 'must be well-formed email address') {
    return 'musi byc poprawnym adresem e-mail.';
  }

  if (trimmedMessage === 'Amount must be positive') {
    return 'musi byc dodatnia.';
  }

  if (trimmedMessage === 'Amount too large') {
    return 'jest zbyt duza.';
  }

  const sizeMatch = trimmedMessage.match(/^size must be between (\d+) and (\d+)$/);
  if (sizeMatch) {
    const minimum = Number(sizeMatch[1]);
    const maximum = Number(sizeMatch[2]);

    if (minimum === 0) {
      return `moze miec maksymalnie ${maximum} znakow.`;
    }

    return `musi miec od ${minimum} do ${maximum} znakow.`;
  }

  const minMatch = trimmedMessage.match(/^must be greater than or equal to ([0-9.]+)$/);
  if (minMatch) {
    return `musi byc wieksze lub rowne ${minMatch[1]}.`;
  }

  const maxMatch = trimmedMessage.match(/^must be less than or equal to ([0-9.]+)$/);
  if (maxMatch) {
    return `musi byc mniejsze lub rowne ${maxMatch[1]}.`;
  }

  return normalizeBackendMessage(trimmedMessage, false);
}

function normalizeBackendMessage(message: string, ensureSentence = true): string {
  const trimmedMessage = message.trim();

  if (trimmedMessage.length === 0) {
    return 'Wystapil nieoczekiwany blad.';
  }

  const exactMatch = EXACT_MESSAGE_MAP[trimmedMessage];
  if (exactMatch) {
    return exactMatch;
  }

  if (trimmedMessage.startsWith('Insufficient balance: required ')) {
    const match = trimmedMessage.match(/required\s+([0-9.]+),\s+available\s+([0-9.]+)/);
    if (match) {
      return `Brakuje srodkow na koncie. Wymagana kwota: ${match[1]} PLN. Dostepne srodki: ${match[2]} PLN.`;
    }

    return 'Brakuje srodkow na koncie.';
  }

  if (trimmedMessage.startsWith('Ticket already validated at ')) {
    return 'Ten bilet zostal juz skasowany.';
  }

  if (trimmedMessage.startsWith('validFrom/validTo are not allowed for ')) {
    return 'Dla tego rodzaju biletu nie podaje sie zakresu dat.';
  }

  if (trimmedMessage.startsWith('Malformed request body:')) {
    return 'Przeslane dane maja nieprawidlowy format.';
  }

  if (!ensureSentence) {
    return trimmedMessage;
  }

  return appendPeriodIfNeeded(trimmedMessage);
}

function getStatusFallback(status: number): string {
  switch (status) {
    case 400:
      return 'Przeslane dane sa nieprawidlowe.';
    case 401:
      return 'Sesja wygasla lub wymagane jest zalogowanie.';
    case 402:
      return 'Operacja nie moze zostac wykonana z powodu niewystarczajacych srodkow.';
    case 403:
      return 'Nie masz uprawnien do wykonania tej operacji.';
    case 404:
      return 'Nie znaleziono szukanego zasobu.';
    case 409:
      return 'Operacja jest sprzeczna z aktualnym stanem danych.';
    default:
      return `Nie udalo sie wykonac operacji (kod ${status}).`;
  }
}

function appendPeriodIfNeeded(message: string): string {
  if (/[.!?]$/.test(message)) {
    return message;
  }

  return `${message}.`;
}
