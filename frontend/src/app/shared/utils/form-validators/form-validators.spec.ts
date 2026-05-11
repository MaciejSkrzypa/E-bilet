import { FormControl, FormGroup } from '@angular/forms';

import { toDateInputValue } from '../date/date.util';
import { matchingFieldsValidator, periodDateRangeValidator, uuidPattern } from './form-validators';

describe('form validators', () => {
  it('should validate matching fields', () => {
    const group = new FormGroup(
      {
        password: new FormControl('secret'),
        confirmPassword: new FormControl('secret'),
      },
      {
        validators: [matchingFieldsValidator('password', 'confirmPassword')],
      },
    );

    expect(group.errors).toBeNull();

    group.patchValue({ confirmPassword: 'different' });
    group.updateValueAndValidity();

    expect(group.errors).toEqual({ fieldsMismatch: true });
  });

  it('should validate period range', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const start = toDateInputValue(tomorrow);
    const end = toDateInputValue(dayAfterTomorrow);
    const invalidEnd = toDateInputValue(new Date(tomorrow.getTime() - 24 * 60 * 60 * 1000));

    const group = new FormGroup(
      {
        validFrom: new FormControl(start),
        validTo: new FormControl(end),
      },
      {
        validators: [periodDateRangeValidator('validFrom', 'validTo')],
      },
    );

    expect(group.errors).toBeNull();

    group.patchValue({ validTo: invalidEnd });
    group.updateValueAndValidity();

    expect(group.errors).toEqual({ invalidRange: true });
  });

  it('should expose UUID pattern', () => {
    expect(uuidPattern.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(uuidPattern.test('invalid-code')).toBe(false);
  });
});
