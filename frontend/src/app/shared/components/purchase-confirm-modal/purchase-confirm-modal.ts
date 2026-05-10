import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { TicketOfferResponse } from '../../../core/models/api/api.models';

export type PeriodPurchaseFormGroup = FormGroup<{
  validFrom: FormControl<string>;
  validTo: FormControl<string>;
}>;

@Component({
  selector: 'app-purchase-confirm-modal',
  imports: [DecimalPipe, ReactiveFormsModule],
  templateUrl: './purchase-confirm-modal.html',
  styleUrl: './purchase-confirm-modal.scss',
})
export class PurchaseConfirmModalComponent {
  readonly offer = input.required<TicketOfferResponse>();
  readonly offerTitle = input.required<string>();
  readonly form = input.required<PeriodPurchaseFormGroup>();
  readonly minimumPeriodStart = input.required<string>();
  readonly currentBalance = input.required<number>();
  readonly previewPrice = input<number | null>(null);
  readonly balanceAfterPurchase = input<number | null>(null);
  readonly error = input<string | null>(null);
  readonly isSubmitting = input(false);
  readonly canConfirm = input(false);

  readonly closeRequested = output<void>();
  readonly submitRequested = output<void>();

  protected close(): void {
    this.closeRequested.emit();
  }

  protected submit(): void {
    this.submitRequested.emit();
  }
}
