import { TicketType } from '../../core/models/api/api.models';

export interface TicketTypeFilterOption {
  type: TicketType;
  label: string;
}

export const TICKET_TYPE_FILTER_OPTIONS: readonly TicketTypeFilterOption[] = [
  { type: 'SINGLE', label: 'Jednorazowe' },
  { type: 'TIME', label: 'Czasowe' },
  { type: 'PERIOD', label: 'Okresowe' },
];

export const TICKET_VALIDATION_SUCCESS_MESSAGE = 'Bilet został skasowany poprawnie.';
