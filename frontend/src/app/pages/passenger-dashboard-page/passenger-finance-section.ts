import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { PageResponse, TransactionResponse, TransactionsQuery } from '../../core/models/api/api.models';
import {
  PASSENGER_TRANSACTIONS_PAGE_SIZE,
  PassengerTransactionsResolvedData,
} from '../../core/resolvers/passenger-dashboard/passenger-dashboard.resolver';
import { AccountApiService } from '../../core/services/api/account-api.service';
import { PaginationControlsComponent } from '../../shared/components/pagination-controls/pagination-controls';
import { getErrorMessage } from '../../shared/utils/http-error/http-error.util';

@Component({
  selector: 'app-passenger-finance-section',
  imports: [DatePipe, DecimalPipe, PaginationControlsComponent],
  templateUrl: './passenger-finance-section.html',
  styleUrl: './passenger-dashboard-sections.scss',
})
export class PassengerFinanceSectionComponent {
  protected readonly transactionPageSizeOptions = [5, 10, 20, 50];

  private readonly route = inject(ActivatedRoute);
  private readonly accountApi = inject(AccountApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly transactionsError = signal<string | null>(null);
  protected readonly isTransactionsLoading = signal(false);
  protected readonly transactions = signal<TransactionResponse[]>([]);
  protected readonly transactionPage = signal(0);
  protected readonly transactionPageSize = signal(PASSENGER_TRANSACTIONS_PAGE_SIZE);
  protected readonly transactionTotalElements = signal(0);
  protected readonly transactionTotalPages = signal(0);
  protected readonly transactionFirstPage = signal(true);
  protected readonly transactionLastPage = signal(true);

  private hasResolvedTransactions = false;
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

  constructor() {
    const resolvedData = this.route.snapshot.data['finance'] as PassengerTransactionsResolvedData | undefined;

    if (!resolvedData) {
      this.loadTransactionsPage(0, this.transactionPageSize());
      return;
    }

    if (resolvedData.transactionsPage) {
      this.applyTransactionsPage(resolvedData.transactionsPage);
    }

    this.transactionsError.set(resolvedData.errorMessage);
  }

  protected changeTransactionPage(page: number): void {
    this.loadTransactionsPage(page);
  }

  protected changeTransactionPageSize(size: number): void {
    this.transactionPageSize.set(size);
    this.loadTransactionsPage(0, size);
  }

  protected hasTransactionsSnapshot(): boolean {
    return this.hasResolvedTransactions;
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

  private applyTransactionsPage(transactionsPage: PageResponse<TransactionResponse>): void {
    this.hasResolvedTransactions = true;
    this.transactions.set(transactionsPage.content);
    this.transactionPage.set(transactionsPage.page);
    this.transactionPageSize.set(transactionsPage.size);
    this.transactionTotalElements.set(transactionsPage.totalElements);
    this.transactionTotalPages.set(transactionsPage.totalPages);
    this.transactionFirstPage.set(transactionsPage.first);
    this.transactionLastPage.set(transactionsPage.last);
  }

  private buildTransactionsQuery(page: number, size: number): TransactionsQuery {
    return {
      page,
      size,
      sort: 'createdAt,desc',
    };
  }
}
