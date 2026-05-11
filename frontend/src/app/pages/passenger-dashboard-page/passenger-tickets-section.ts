import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { PageResponse, TicketFilterStatus, TicketResponse, TicketType, TicketsQuery } from '../../core/models/api/api.models';
import { PASSENGER_TICKETS_PAGE_SIZE, PassengerTicketsResolvedData } from '../../core/resolvers/passenger-dashboard/passenger-dashboard.resolver';
import { KasownikApiService } from '../../core/services/api/kasownik-api.service';
import { TicketsApiService } from '../../core/services/api/tickets-api.service';
import { TICKET_TYPE_FILTER_OPTIONS, TICKET_VALIDATION_SUCCESS_MESSAGE } from '../../shared/constants/ticket.constants';
import { PaginationControlsComponent } from '../../shared/components/pagination-controls/pagination-controls';
import {
  TicketValidationFormGroup,
  TicketValidationModalComponent,
} from '../../shared/components/ticket-validation-modal/ticket-validation-modal';
import { getErrorMessage } from '../../shared/utils/http-error/http-error.util';
import {
  canTicketBeValidated,
  getTicketStatus,
  getTicketTitle,
  type TicketStatus,
} from '../../shared/utils/ticket-presentation/ticket-presentation.util';

@Component({
  selector: 'app-passenger-tickets-section',
  imports: [DatePipe, DecimalPipe, PaginationControlsComponent, TicketValidationModalComponent],
  templateUrl: './passenger-tickets-section.html',
  styleUrl: './passenger-dashboard-sections.scss',
})
export class PassengerTicketsSectionComponent {
  protected readonly ticketTypeFilters = TICKET_TYPE_FILTER_OPTIONS;
  protected readonly ticketStateFilters = [
    { status: 'ACTIVE' as const, label: 'Aktywne' },
    { status: 'REQUIRES_VALIDATION' as const, label: 'Do skasowania' },
    { status: 'VALIDATED' as const, label: 'Skasowane' },
  ];
  protected readonly ticketPageSizeOptions = [5, 10, 20, 50];

  private readonly route = inject(ActivatedRoute);
  private readonly kasownikApi = inject(KasownikApiService);
  private readonly ticketsApi = inject(TicketsApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly ticketsError = signal<string | null>(null);
  protected readonly isTicketsLoading = signal(false);
  protected readonly tickets = signal<TicketResponse[]>([]);
  protected readonly selectedValidationTicket = signal<TicketResponse | null>(null);
  protected readonly validationError = signal<string | null>(null);
  protected readonly validationSuccess = signal<string | null>(null);
  protected readonly isValidationPending = signal(false);
  protected readonly ticketPage = signal(0);
  protected readonly ticketPageSize = signal(PASSENGER_TICKETS_PAGE_SIZE);
  protected readonly ticketTotalElements = signal(0);
  protected readonly ticketTotalPages = signal(0);
  protected readonly ticketFirstPage = signal(true);
  protected readonly ticketLastPage = signal(true);
  protected readonly selectedTicketTypes = signal<TicketType[]>([]);
  protected readonly selectedTicketStatus = signal<TicketFilterStatus | null>(null);

  private hasResolvedTickets = false;
  protected readonly emptyTicketSlots = computed(() => {
    if (this.ticketTotalPages() <= 1) {
      return [];
    }

    const missingItems = this.ticketPageSize() - this.tickets().length;
    if (missingItems <= 0) {
      return [];
    }

    return Array.from({ length: missingItems }, (_, index) => index);
  });
  protected readonly validationForm: TicketValidationFormGroup = new FormGroup<{
    vehicleQuery: FormControl<string>;
    vehicleId: FormControl<number | null>;
  }>({
    vehicleQuery: new FormControl('', {
      nonNullable: true,
    }),
    vehicleId: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
  });
  protected readonly hasTicketFilters = computed(
    () => this.selectedTicketTypes().length > 0 || this.selectedTicketStatus() !== null,
  );

  constructor() {
    const resolvedData = this.route.snapshot.data['tickets'] as PassengerTicketsResolvedData | undefined;

    if (!resolvedData) {
      this.loadTicketsPage(0, this.ticketPageSize());
      return;
    }

    if (resolvedData.ticketsPage) {
      this.applyTicketsPage(resolvedData.ticketsPage);
    }

    this.ticketsError.set(resolvedData.errorMessage);
  }

  protected ticketTitle(ticket: TicketResponse): string {
    return getTicketTitle(ticket);
  }

  protected ticketStatus(ticket: TicketResponse): TicketStatus {
    return getTicketStatus(ticket);
  }

  protected canValidateTicket(ticket: TicketResponse): boolean {
    return canTicketBeValidated(ticket);
  }

  protected toggleTicketTypeFilter(type: TicketType): void {
    this.selectedTicketTypes.update((selectedTypes) =>
      selectedTypes.includes(type) ? selectedTypes.filter((selectedType) => selectedType !== type) : [...selectedTypes, type],
    );
    this.loadTicketsPage(0);
  }

  protected isTicketTypeSelected(type: TicketType): boolean {
    return this.selectedTicketTypes().includes(type);
  }

  protected toggleTicketStatusFilter(status: TicketFilterStatus): void {
    this.selectedTicketStatus.update((selectedStatus) => (selectedStatus === status ? null : status));
    this.loadTicketsPage(0);
  }

  protected isTicketStatusSelected(status: TicketFilterStatus): boolean {
    return this.selectedTicketStatus() === status;
  }

  protected changeTicketPage(page: number): void {
    this.loadTicketsPage(page);
  }

  protected changeTicketPageSize(size: number): void {
    this.ticketPageSize.set(size);
    this.loadTicketsPage(0, size);
  }

  protected openValidationModal(ticket: TicketResponse): void {
    if (!this.canValidateTicket(ticket)) {
      return;
    }

    this.validationSuccess.set(null);
    this.validationError.set(null);
    this.resetValidationForm();
    this.selectedValidationTicket.set(ticket);
  }

  protected closeValidationModal(): void {
    this.selectedValidationTicket.set(null);
    this.validationError.set(null);
    this.resetValidationForm();
  }

  protected submitValidation(): void {
    const ticket = this.selectedValidationTicket();

    if (!ticket) {
      return;
    }

    if (this.validationForm.invalid) {
      this.validationForm.markAllAsTouched();
      return;
    }

    const vehicleId = this.validationForm.getRawValue().vehicleId;
    if (vehicleId === null) {
      this.validationForm.markAllAsTouched();
      return;
    }

    this.isValidationPending.set(true);
    this.validationError.set(null);

    this.kasownikApi
      .validate({
        code: ticket.code,
        vehicleId,
      })
      .pipe(
        finalize(() => this.isValidationPending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.validationSuccess.set(TICKET_VALIDATION_SUCCESS_MESSAGE);
          this.closeValidationModal();

          const nextPage = this.ticketPage() > 0 && this.tickets().length === 1 ? this.ticketPage() - 1 : this.ticketPage();
          this.loadTicketsPage(nextPage);
        },
        error: (error) => {
          this.validationError.set(getErrorMessage(error, 'Kasowanie biletu nie powiodło się.'));
        },
      });
  }

  protected hasTicketsSnapshot(): boolean {
    return this.hasResolvedTickets;
  }

  private loadTicketsPage(page = this.ticketPage(), size = this.ticketPageSize()): void {
    this.isTicketsLoading.set(true);
    this.ticketsError.set(null);

    this.ticketsApi
      .list(this.buildTicketsQuery(page, size))
      .pipe(finalize(() => this.isTicketsLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ticketsPage) => {
          this.applyTicketsPage(ticketsPage);
        },
        error: (error) => {
          this.ticketsError.set(getErrorMessage(error, 'Nie udało się załadować listy biletów.'));
        },
      });
  }

  private applyTicketsPage(ticketsPage: PageResponse<TicketResponse>): void {
    this.hasResolvedTickets = true;
    this.tickets.set(ticketsPage.content);
    this.ticketPage.set(ticketsPage.page);
    this.ticketPageSize.set(ticketsPage.size);
    this.ticketTotalElements.set(ticketsPage.totalElements);
    this.ticketTotalPages.set(ticketsPage.totalPages);
    this.ticketFirstPage.set(ticketsPage.first);
    this.ticketLastPage.set(ticketsPage.last);
  }

  private resetValidationForm(): void {
    this.validationForm.reset({
      vehicleQuery: '',
      vehicleId: null,
    });
    this.validationForm.markAsPristine();
    this.validationForm.markAsUntouched();
  }

  private buildTicketsQuery(page: number, size: number): TicketsQuery {
    const selectedTypes = this.selectedTicketTypes();
    const selectedStatus = this.selectedTicketStatus();

    return {
      page,
      size,
      sort: this.resolveTicketsSort(selectedStatus),
      type: selectedTypes.length > 0 ? selectedTypes : undefined,
      status: selectedStatus ? [selectedStatus] : undefined,
    };
  }

  private resolveTicketsSort(status: TicketFilterStatus | null): string {
    if (status === 'ACTIVE' || status === 'VALIDATED') {
      return 'validatedAt,desc';
    }

    return 'purchaseDate,desc';
  }
}
