import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import {
  PageResponse,
  TicketFilterStatus,
  TicketResponse,
  TicketType,
  TicketsQuery,
  TransactionResponse,
  TransactionsQuery,
} from '../../core/models/api/api.models';
import {
  PASSENGER_TICKETS_PAGE_SIZE,
  PASSENGER_TRANSACTIONS_PAGE_SIZE,
  PassengerDashboardResolvedData,
  PassengerSnapshot,
} from '../../core/resolvers/passenger-dashboard/passenger-dashboard.resolver';
import { AccountApiService } from '../../core/services/api/account-api.service';
import { KasownikApiService } from '../../core/services/api/kasownik-api.service';
import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { TicketsApiService } from '../../core/services/api/tickets-api.service';
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

type PassengerSection = 'finance' | 'tickets' | 'profile';

interface PassengerSectionTab {
  id: PassengerSection;
  label: string;
}

interface ProfileField {
  label: string;
  value: string;
}

@Component({
  selector: 'app-passenger-dashboard-page',
  imports: [DatePipe, DecimalPipe, PaginationControlsComponent, RouterLink, TicketValidationModalComponent],
  templateUrl: './passenger-dashboard-page.html',
  styleUrl: './passenger-dashboard-page.scss',
})
export class PassengerDashboardPageComponent {
  protected readonly sectionTabs: readonly PassengerSectionTab[] = [
    { id: 'finance', label: 'Historia finansowa' },
    { id: 'tickets', label: 'Moje bilety' },
    { id: 'profile', label: 'O mnie' },
  ];
  protected readonly ticketTypeFilters = [
    { type: 'SINGLE' as const, label: 'Jednorazowe' },
    { type: 'TIME' as const, label: 'Czasowe' },
    { type: 'PERIOD' as const, label: 'Okresowe' },
  ];
  protected readonly ticketStateFilters = [
    { status: 'ACTIVE' as const, label: 'Aktywne' },
    { status: 'REQUIRES_VALIDATION' as const, label: 'Do skasowania' },
    { status: 'VALIDATED' as const, label: 'Skasowane' },
  ];
  protected readonly ticketPageSizeOptions = [5, 10, 20, 50];
  protected readonly transactionPageSizeOptions = [5, 10, 20, 50];
  protected readonly authStore = inject(AuthStoreService);

  private readonly route = inject(ActivatedRoute);
  private readonly accountApi = inject(AccountApiService);
  private readonly kasownikApi = inject(KasownikApiService);
  private readonly ticketsApi = inject(TicketsApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly ticketsError = signal<string | null>(null);
  protected readonly transactionsError = signal<string | null>(null);
  protected readonly isTicketsLoading = signal(false);
  protected readonly isTransactionsLoading = signal(false);
  protected readonly tickets = signal<TicketResponse[]>([]);
  protected readonly transactions = signal<TransactionResponse[]>([]);
  protected readonly currentSection = signal<PassengerSection>('finance');
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
  protected readonly transactionPage = signal(0);
  protected readonly transactionPageSize = signal(PASSENGER_TRANSACTIONS_PAGE_SIZE);
  protected readonly transactionTotalElements = signal(0);
  protected readonly transactionTotalPages = signal(0);
  protected readonly transactionFirstPage = signal(true);
  protected readonly transactionLastPage = signal(true);
  protected readonly latestTransaction = signal<TransactionResponse | null>(null);
  protected readonly selectedTicketTypes = signal<TicketType[]>([]);
  protected readonly selectedTicketStatuses = signal<TicketFilterStatus[]>([]);
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
  protected readonly emptyTransactionSlots = computed(() => {
    if (this.transactionTotalPages() <= 1) {
      return [];
    }

    const missingItems = this.transactionPageSize() - this.transactions().length;
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
    () => this.selectedTicketTypes().length > 0 || this.selectedTicketStatuses().length > 0,
  );
  protected readonly profileFields = computed<ProfileField[]>(() => {
    const user = this.authStore.user();

    if (!user) {
      return [];
    }

    return [
      { label: 'Adres e-mail', value: user.email },
      { label: 'Imie', value: user.firstName },
      { label: 'Nazwisko', value: user.lastName },
      { label: 'Data urodzenia', value: this.formatDateLabel(user.dateOfBirth) },
    ];
  });

  constructor() {
    this.currentSection.set(this.normalizeSection(this.route.snapshot.fragment));
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fragment) => {
      this.currentSection.set(this.normalizeSection(fragment));
    });

    const resolvedData = this.route.snapshot.data['dashboard'] as PassengerDashboardResolvedData | undefined;

    if (resolvedData) {
      this.applyResolvedData(resolvedData);
      return;
    }

    this.loadDashboard();
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
    this.selectedTicketStatuses.update((selectedStatuses) =>
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status)
        : [...selectedStatuses, status],
    );
    this.loadTicketsPage(0);
  }

  protected isTicketStatusSelected(status: TicketFilterStatus): boolean {
    return this.selectedTicketStatuses().includes(status);
  }

  protected changeTicketPage(page: number): void {
    this.loadTicketsPage(page);
  }

  protected changeTicketPageSize(size: number): void {
    this.ticketPageSize.set(size);
    this.loadTicketsPage(0, size);
  }

  protected changeTransactionPage(page: number): void {
    this.loadTransactionsPage(page);
  }

  protected changeTransactionPageSize(size: number): void {
    this.transactionPageSize.set(size);
    this.loadTransactionsPage(0, size);
  }

  protected openValidationModal(ticket: TicketResponse): void {
    if (!this.canValidateTicket(ticket)) {
      return;
    }

    this.validationSuccess.set(null);
    this.validationError.set(null);
    this.validationForm.reset({
      vehicleQuery: '',
      vehicleId: null,
    });
    this.validationForm.markAsPristine();
    this.validationForm.markAsUntouched();
    this.selectedValidationTicket.set(ticket);
  }

  protected closeValidationModal(): void {
    this.selectedValidationTicket.set(null);
    this.validationError.set(null);
    this.validationForm.reset({
      vehicleQuery: '',
      vehicleId: null,
    });
    this.validationForm.markAsPristine();
    this.validationForm.markAsUntouched();
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
          this.validationSuccess.set('Bilet zostal skasowany poprawnie.');
          this.closeValidationModal();

          const nextPage = this.ticketPage() > 0 && this.tickets().length === 1 ? this.ticketPage() - 1 : this.ticketPage();
          this.loadTicketsPage(nextPage);
        },
        error: (error) => {
          this.validationError.set(getErrorMessage(error, 'Kasowanie biletu nie powiodlo sie.'));
        },
      });
  }

  protected isSectionActive(section: PassengerSection): boolean {
    return this.currentSection() === section;
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.loadAccountSnapshot()
      .pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (snapshot) => {
          this.applySnapshot(snapshot);
        },
        error: (error) => {
          this.loadError.set(getErrorMessage(error, 'Nie udalo sie zaladowac danych pasazera.'));
        },
      });
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
          this.ticketsError.set(getErrorMessage(error, 'Nie udalo sie zaladowac listy biletow.'));
        },
      });
  }

  private loadTransactionsPage(page = this.transactionPage(), size = this.transactionPageSize()): void {
    this.isTransactionsLoading.set(true);
    this.transactionsError.set(null);

    this.accountApi
      .transactions(this.buildTransactionsQuery(page, size))
      .pipe(finalize(() => this.isTransactionsLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (transactionsPage) => {
          this.applyTransactionsPage(transactionsPage);
        },
        error: (error) => {
          this.transactionsError.set(getErrorMessage(error, 'Nie udalo sie zaladowac historii transakcji.'));
        },
      });
  }

  private applyResolvedData(resolvedData: PassengerDashboardResolvedData): void {
    if (resolvedData.snapshot) {
      this.applySnapshot(resolvedData.snapshot);
    }

    this.loadError.set(resolvedData.errorMessage);
    this.isLoading.set(false);
  }

  private loadAccountSnapshot() {
    return forkJoin({
      user: this.accountApi.me(),
      ticketsPage: this.ticketsApi.list(this.buildTicketsQuery(0, this.ticketPageSize())),
      transactionsPage: this.accountApi.transactions(this.buildTransactionsQuery(0, this.transactionPageSize())),
    });
  }

  private applySnapshot(snapshot: PassengerSnapshot): void {
    this.authStore.updateUser(snapshot.user);
    this.applyTicketsPage(snapshot.ticketsPage);
    this.applyTransactionsPage(snapshot.transactionsPage);
  }

  private applyTicketsPage(ticketsPage: PageResponse<TicketResponse>): void {
    this.tickets.set(ticketsPage.content);
    this.ticketPage.set(ticketsPage.page);
    this.ticketPageSize.set(ticketsPage.size);
    this.ticketTotalElements.set(ticketsPage.totalElements);
    this.ticketTotalPages.set(ticketsPage.totalPages);
    this.ticketFirstPage.set(ticketsPage.first);
    this.ticketLastPage.set(ticketsPage.last);
  }

  private applyTransactionsPage(transactionsPage: PageResponse<TransactionResponse>): void {
    this.transactions.set(transactionsPage.content);
    this.transactionPage.set(transactionsPage.page);
    this.transactionPageSize.set(transactionsPage.size);
    this.transactionTotalElements.set(transactionsPage.totalElements);
    this.transactionTotalPages.set(transactionsPage.totalPages);
    this.transactionFirstPage.set(transactionsPage.first);
    this.transactionLastPage.set(transactionsPage.last);

    if (transactionsPage.page === 0) {
      this.latestTransaction.set(transactionsPage.content[0] ?? null);
    }
  }

  private buildTicketsQuery(page: number, size: number): TicketsQuery {
    const selectedTypes = this.selectedTicketTypes();
    const selectedStatuses = this.selectedTicketStatuses();

    return {
      page,
      size,
      sort: 'purchaseDate,desc',
      type: selectedTypes.length > 0 ? selectedTypes : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    };
  }

  private buildTransactionsQuery(page: number, size: number): TransactionsQuery {
    return {
      page,
      size,
      sort: 'createdAt,desc',
    };
  }

  private normalizeSection(fragment: string | null): PassengerSection {
    if (fragment === 'tickets' || fragment === 'profile') {
      return fragment;
    }

    return 'finance';
  }

  private formatDateLabel(dateValue: string): string {
    const [year, month, day] = dateValue.split('-');

    if (!year || !month || !day) {
      return dateValue;
    }

    return `${day}.${month}.${year}`;
  }
}
