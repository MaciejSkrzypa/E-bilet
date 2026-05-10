import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { VehicleAutocompleteFieldComponent } from '../vehicle-autocomplete-field/vehicle-autocomplete-field';

export type TicketValidationFormGroup = FormGroup<{
  vehicleQuery: FormControl<string>;
  vehicleId: FormControl<number | null>;
}>;

@Component({
  selector: 'app-ticket-validation-modal',
  imports: [ReactiveFormsModule, VehicleAutocompleteFieldComponent],
  templateUrl: './ticket-validation-modal.html',
  styleUrl: './ticket-validation-modal.scss',
})
export class TicketValidationModalComponent {
  readonly title = input.required<string>();
  readonly form = input.required<TicketValidationFormGroup>();
  readonly error = input<string | null>(null);
  readonly isSubmitting = input(false);

  readonly closeRequested = output<void>();
  readonly submitRequested = output<void>();

  protected close(): void {
    this.closeRequested.emit();
  }

  protected submit(): void {
    this.submitRequested.emit();
  }
}
