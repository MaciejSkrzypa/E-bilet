import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

export type TopUpFormGroup = FormGroup<{
  amount: FormControl<number>;
}>;

@Component({
  selector: 'app-top-up-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './top-up-modal.html',
  styleUrl: './top-up-modal.scss',
})
export class TopUpModalComponent {
  readonly presetAmounts = input.required<readonly number[]>();
  readonly form = input.required<TopUpFormGroup>();
  readonly error = input<string | null>(null);
  readonly isSubmitting = input(false);

  readonly closeRequested = output<void>();
  readonly presetSelected = output<number>();
  readonly submitRequested = output<void>();

  protected close(): void {
    this.closeRequested.emit();
  }

  protected selectPreset(amount: number): void {
    this.presetSelected.emit(amount);
  }

  protected submit(): void {
    this.submitRequested.emit();
  }
}
