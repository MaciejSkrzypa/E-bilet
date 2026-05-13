import { HttpErrorResponse } from '@angular/common/http';

import { ApiErrorResponse } from '../../../core/models/api/api.models';

const FIELD_LABELS: Record<string, string> = {
  amount: 'Kwota',
  code: 'Kod biletu',
  dateOfBirth: 'Data urodzenia',
  email: 'Adres e-mail',
  firstName: 'Imię',
  lastName: 'Nazwisko',
  offerId: 'Oferta biletu',
  password: 'Hasło',
  validFrom: 'Data początkowa',
  validTo: 'Data końcowa',
  vehicleId: 'Pojazd',
};

const EXACT_MESSAGE_MAP: Record<string, string> = {
  'Access denied: insufficient role for this resource': 'Nie masz uprawnień do tej sekcji.',
  'Amount must be positive': 'Kwota musi być dodatnia.',
  'Amount too large': 'Kwota jest zbyt duża.',
  'Authentication required: missing or invalid Bearer token': 'Sesja wygasła lub jest nieprawidłowa. Zaloguj się ponownie.',
  'Constraint violation': 'Przesłane dane są nieprawidłowe.',
  'Email already registered': 'Konto z tym adresem e-mail już istnieje.',
  'Inspection vehicle not found': 'Nie znaleziono pojazdu do kontroli.',
  'Invalid credentials': 'Nieprawidłowy adres e-mail lub hasło.',
  'Offer not found': 'Nie znaleziono oferty biletu.',
  'PERIOD tickets do not require validation (no kasowanie)': 'Bilety okresowe nie wymagają kasowania.',
  'Request validation failed': 'Sprawdź poprawność formularza.',
  'Ticket not found': 'Nie znaleziono biletu.',
  'Ticket does not belong to authenticated user': 'Ten bilet nie należy do zalogowanego użytkownika.',
  'Ticket time fields must match its type': 'Dane ważności biletu nie zgadzają się z jego typem.',
  'User not found': 'Nie znaleziono użytkownika.',
  'Vehicle not found': 'Nie znaleziono pojazdu.',
  'validFrom and validTo are required for PERIOD tickets': 'Dla biletu okresowego wybierz datę początkową i końcową.',
  'validFrom cannot be in the past': 'Data początkowa nie może być z przeszłości.',
  'validFrom must be on or before validTo': 'Data początkowa nie może być późniejsza niż data końcowa.',
};

export function getErrorMessage(error: unknown, fallback = 'Wystąpił nieoczekiwany błąd.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Nie udało się połączyć z serwisem. Spróbuj ponownie za chwilę.';
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
    return 'musi wskazywać datę z przeszłości.';
  }

  if (trimmedMessage === 'must not be blank' || trimmedMessage === 'must not be null') {
    return 'jest wymagane.';
  }

  if (trimmedMessage === 'must be a well-formed email address' || trimmedMessage === 'must be well-formed email address') {
    return 'musi być poprawnym adresem e-mail.';
  }

  if (trimmedMessage === 'Amount must be positive') {
    return 'musi być dodatnia.';
  }

  if (trimmedMessage === 'Amount too large') {
    return 'jest zbyt duża.';
  }

  const sizeMatch = trimmedMessage.match(/^size must be between (\d+) and (\d+)$/);
  if (sizeMatch) {
    const minimum = Number(sizeMatch[1]);
    const maximum = Number(sizeMatch[2]);

    if (minimum === 0) {
      return `może mieć maksymalnie ${maximum} znaków.`;
    }

    return `musi mieć od ${minimum} do ${maximum} znaków.`;
  }

  const minMatch = trimmedMessage.match(/^must be greater than or equal to ([0-9.]+)$/);
  if (minMatch) {
    return `musi być większe lub równe ${minMatch[1]}.`;
  }

  const maxMatch = trimmedMessage.match(/^must be less than or equal to ([0-9.]+)$/);
  if (maxMatch) {
    return `musi być mniejsze lub równe ${maxMatch[1]}.`;
  }

  return normalizeBackendMessage(trimmedMessage, false);
}

function normalizeBackendMessage(message: string, ensureSentence = true): string {
  const trimmedMessage = message.trim();

  if (trimmedMessage.length === 0) {
    return 'Wystąpił nieoczekiwany błąd.';
  }

  const exactMatch = EXACT_MESSAGE_MAP[trimmedMessage];
  if (exactMatch) {
    return exactMatch;
  }

  if (trimmedMessage.startsWith('Insufficient balance: required ')) {
    const match = trimmedMessage.match(/required\s+([0-9.]+),\s+available\s+([0-9.]+)/);
    if (match) {
      return `Brakuje środków na koncie. Wymagana kwota: ${match[1]} PLN. Dostępne środki: ${match[2]} PLN.`;
    }

    return 'Brakuje środków na koncie.';
  }

  if (trimmedMessage.startsWith('Ticket already validated at ')) {
    return 'Ten bilet został już skasowany.';
  }

  if (trimmedMessage.startsWith('validFrom/validTo are not allowed for ')) {
    return 'Dla tego rodzaju biletu nie podaje się zakresu dat.';
  }

  if (trimmedMessage.startsWith('Malformed request body:')) {
    return 'Przesłane dane mają nieprawidłowy format.';
  }

  if (!ensureSentence) {
    return trimmedMessage;
  }

  return appendPeriodIfNeeded(trimmedMessage);
}

function getStatusFallback(status: number): string {
  switch (status) {
    case 400:
      return 'Przesłane dane są nieprawidłowe.';
    case 401:
      return 'Sesja wygasła lub wymagane jest zalogowanie.';
    case 402:
      return 'Operacja nie może zostać wykonana z powodu niewystarczających środków.';
    case 403:
      return 'Nie masz uprawnień do wykonania tej operacji.';
    case 404:
      return 'Nie znaleziono szukanego zasobu.';
    case 409:
      return 'Operacja jest sprzeczna z aktualnym stanem danych.';
    default:
      return `Nie udało się wykonać operacji (kod ${status}).`;
  }
}

function appendPeriodIfNeeded(message: string): string {
  if (/[.!?]$/.test(message)) {
    return message;
  }

  return `${message}.`;
}
