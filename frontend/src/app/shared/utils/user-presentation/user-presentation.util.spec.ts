import { buildUserProfileFields } from './user-presentation.util';

describe('user presentation util', () => {
  it('should build profile fields from user response', () => {
    expect(
      buildUserProfileFields({
        id: 1,
        email: 'anna@example.com',
        firstName: 'Anna',
        lastName: 'Nowak',
        dateOfBirth: '1995-04-12',
        role: 'PASSENGER',
        balance: 25,
      }),
    ).toEqual([
      { label: 'Adres e-mail', value: 'anna@example.com' },
      { label: 'Imie', value: 'Anna' },
      { label: 'Nazwisko', value: 'Nowak' },
      { label: 'Data urodzenia', value: '12.04.1995' },
    ]);
  });

  it('should return empty list when user is missing', () => {
    expect(buildUserProfileFields(null)).toEqual([]);
  });
});
