import { UserResponse } from '../../../core/models/api/api.models';
import { formatDateLabel } from '../date/date.util';

export interface ProfileField {
  label: string;
  value: string;
}

export function buildUserProfileFields(user: UserResponse | null | undefined): ProfileField[] {
  if (!user) {
    return [];
  }

  return [
    { label: 'Adres e-mail', value: user.email },
    { label: 'Imie', value: user.firstName },
    { label: 'Nazwisko', value: user.lastName },
    { label: 'Data urodzenia', value: formatDateLabel(user.dateOfBirth) },
  ];
}
