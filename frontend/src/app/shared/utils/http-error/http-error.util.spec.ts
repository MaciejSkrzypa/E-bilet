import { HttpErrorResponse } from '@angular/common/http';

import { getErrorMessage } from './http-error.util';

describe('getErrorMessage', () => {
  it('should return network message for status 0', () => {
    const error = new HttpErrorResponse({ status: 0 });
    expect(getErrorMessage(error)).toBe('Nie udalo sie polaczyc z serwisem. Sprobuj ponownie za chwile.');
  });

  it('should prefer backend validation errors', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        errors: ['dateOfBirth: must be a past date'],
      },
    });

    expect(getErrorMessage(error)).toBe('Data urodzenia: musi wskazywac date z przeszlosci.');
  });

  it('should format multiple validation messages from backend', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        errors: ['email: must be a well-formed email address', 'password: size must be between 6 and 128'],
      },
    });

    expect(getErrorMessage(error)).toBe(
      '• Adres e-mail: musi byc poprawnym adresem e-mail.\n• Haslo: musi miec od 6 do 128 znakow.',
    );
  });

  it('should map common backend domain messages to user-friendly copy', () => {
    const messageError = new HttpErrorResponse({
      status: 403,
      error: {
        message: 'Access denied: insufficient role for this resource',
      },
    });
    const rawError = new HttpErrorResponse({
      status: 401,
      error: {
        message: 'Invalid credentials',
      },
    });
    const balanceError = new HttpErrorResponse({
      status: 402,
      error: {
        message: 'Insufficient balance: required 25.00, available 7.50',
      },
    });

    expect(getErrorMessage(messageError)).toBe('Nie masz uprawnien do tej sekcji.');
    expect(getErrorMessage(rawError)).toBe('Nieprawidlowy adres e-mail lub haslo.');
    expect(getErrorMessage(balanceError)).toBe(
      'Brakuje srodkow na koncie. Wymagana kwota: 25.00 PLN. Dostepne srodki: 7.50 PLN.',
    );
  });

  it('should normalize malformed body and already validated ticket messages', () => {
    const malformedError = new HttpErrorResponse({
      status: 400,
      error: {
        message: 'Malformed request body: Cannot deserialize value of type',
      },
    });
    const validatedTicketError = new HttpErrorResponse({
      status: 409,
      error: {
        message: 'Ticket already validated at 2026-05-10T08:30:00',
      },
    });

    expect(getErrorMessage(malformedError)).toBe('Przeslane dane maja nieprawidlowy format.');
    expect(getErrorMessage(validatedTicketError)).toBe('Ten bilet zostal juz skasowany.');
  });

  it('should build generic HTTP fallback', () => {
    const error = new HttpErrorResponse({ status: 500, error: {} });
    expect(getErrorMessage(error)).toBe('Nie udalo sie wykonac operacji (kod 500).');
  });

  it('should fall back to generic message for unknown error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
  });
});
