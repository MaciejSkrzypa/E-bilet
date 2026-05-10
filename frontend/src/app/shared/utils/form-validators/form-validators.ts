import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function matchingFieldsValidator(firstField: string, secondField: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const firstValue = group.get(firstField)?.value;
    const secondValue = group.get(secondField)?.value;

    if (!firstValue || !secondValue) {
      return null;
    }

    return firstValue === secondValue ? null : { fieldsMismatch: true };
  };
}

export function periodDateRangeValidator(startField: string, endField: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const startValue = group.get(startField)?.value;
    const endValue = group.get(endField)?.value;

    if (!startValue || !endValue) {
      return null;
    }

    const startDate = new Date(`${startValue}T00:00:00`);
    const endDate = new Date(`${endValue}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return { invalidDate: true };
    }

    if (startDate > endDate) {
      return { invalidRange: true };
    }

    if (startDate < today) {
      return { startInPast: true };
    }

    return null;
  };
}
