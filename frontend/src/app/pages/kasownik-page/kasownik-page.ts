import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { TicketResponse, TicketType } from '../../core/models/api/api.models';
import { KasownikApiService } from '../../core/services/api/kasownik-api.service';
import { TicketsApiService } from '../../core/services/api/tickets-api.service';
import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { TICKET_VALIDATION_SUCCESS_MESSAGE } from '../../shared/constants/ticket.constants';
import { VehicleAutocompleteFieldComponent } from '../../shared/components/vehicle-autocomplete-field/vehicle-autocomplete-field';
import { uuidPattern } from '../../shared/utils/form-validators/form-validators';
import { getErrorMessage } from '../../shared/utils/http-error/http-error.util';
import {
  canTicketBeValidated,
  getTicketTitle,
  getTicketTypeLabel,
} from '../../shared/utils/ticket-presentation/ticket-presentation.util';

type ValidationMode = 'ticket' | 'code';

@Component({
  selector: 'app-kasownik-page',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, VehicleAutocompleteFieldComponent],
  templateUrl: './kasownik-page.html',
  styleUrl: './kasownik-page.scss',
})
export class KasownikPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authStore = inject(AuthStoreService);
  private readonly kasownikApi = inject(KasownikApiService);
  private readonly ticketsApi = inject(TicketsApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isSubmitting = signal(false);
  protected readonly validationMode = signal<ValidationMode>('code');
  protected readonly isLoadingOwnedTickets = signal(false);
  protected readonly ownedTicketsError = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly ticket = signal<TicketResponse | null>(null);
  protected readonly availableTickets = signal<TicketResponse[]>([]);
  protected readonly form = this.formBuilder.group({
    code: ['', [Validators.required, Validators.pattern(uuidPattern)]],
    selectedTicketCode: [''],
    vehicleQuery: [''],
    vehicleId: new FormControl<number | null>(null, { validators: [Validators.required] }),
  });

  constructor() {
    if (this.canUseOwnedTicketPicker()) {
      this.loadOwnedTickets();
    }
  }

  protected ticketTypeLabel(type: TicketType): string {
    return getTicketTypeLabel(type);
  }

  protected ticketTitle(ticket: TicketResponse): string {
    return getTicketTitle(ticket);
  }

  protected canUseOwnedTicketPicker(): boolean {
    return this.authStore.role() === 'PASSENGER';
  }

  protected setValidationMode(mode: ValidationMode, resetFeedback = true): void {
    this.validationMode.set(mode);

    if (resetFeedback) {
      this.errorMessage.set(null);
      this.successMessage.set(null);
      this.ticket.set(null);
    }

    const codeControl = this.form.controls.code;
    const selectedTicketCodeControl = this.form.controls.selectedTicketCode;

    if (mode === 'code') {
      codeControl.setValidators([Validators.required, Validators.pattern(uuidPattern)]);
      selectedTicketCodeControl.clearValidators();
    } else {
      codeControl.clearValidators();
      selectedTicketCodeControl.setValidators([Validators.required]);
    }

    codeControl.updateValueAndValidity({ emitEvent: false });
    selectedTicketCodeControl.updateValueAndValidity({ emitEvent: false });
  }

  protected selectedOwnedTicket(): TicketResponse | null {
    const selectedCode = this.form.controls.selectedTicketCode.value;

    return this.availableTickets().find((ticket) => ticket.code === selectedCode) ?? null;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const code =
      this.validationMode() === 'ticket' ? this.form.controls.selectedTicketCode.value : this.form.controls.code.value;

    if (!code) {
      this.form.markAllAsTouched();
      return;
    }

    const vehicleId = this.form.controls.vehicleId.getRawValue();
    if (vehicleId === null) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.kasownikApi
      .validate({
        code,
        vehicleId,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (ticket) => {
          this.ticket.set(ticket);
          this.successMessage.set(TICKET_VALIDATION_SUCCESS_MESSAGE);
          this.availableTickets.update((tickets) => tickets.filter((currentTicket) => currentTicket.code !== ticket.code));

          if (this.validationMode() === 'ticket') {
            const nextTicket = this.availableTickets()[0];
            this.form.controls.selectedTicketCode.setValue(nextTicket?.code ?? '');

            if (!nextTicket) {
              this.setValidationMode('code', false);
            }
          }
        },
        error: (error) => {
          this.ticket.set(null);
          this.errorMessage.set(getErrorMessage(error, 'Kasowanie biletu nie powiodło się.'));
        },
      });
  }

  private loadOwnedTickets(): void {
    this.isLoadingOwnedTickets.set(true);
    this.ownedTicketsError.set(null);

    this.ticketsApi
      .list({
        page: 0,
        size: 100,
        sort: 'purchaseDate,desc',
        type: ['SINGLE', 'TIME'],
        validated: false,
      })
      .pipe(
        finalize(() => this.isLoadingOwnedTickets.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (ticketsPage) => {
          const ticketsToValidate = ticketsPage.content.filter((ticket) => canTicketBeValidated(ticket));
          this.availableTickets.set(ticketsToValidate);

          if (ticketsToValidate.length > 0) {
            this.form.controls.selectedTicketCode.setValue(ticketsToValidate[0].code);
            this.setValidationMode('ticket');
          } else {
            this.form.controls.selectedTicketCode.setValue('');
          }
        },
        error: (error) => {
          this.availableTickets.set([]);
          this.ownedTicketsError.set(getErrorMessage(error, 'Nie udało się załadować Twoich biletów do skasowania.'));
          this.setValidationMode('code');
        },
      });
  }
}
