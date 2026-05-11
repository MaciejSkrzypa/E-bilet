import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, finalize, map, of, switchMap } from 'rxjs';

import { AccountApiService } from '../../core/services/api/account-api.service';
import {
  OffersQuery,
  TicketOfferResponse,
  TicketType,
} from '../../core/models/api/api.models';
import { OffersApiService } from '../../core/services/api/offers-api.service';
import { TicketsApiService } from '../../core/services/api/tickets-api.service';
import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { TICKET_TYPE_FILTER_OPTIONS } from '../../shared/constants/ticket.constants';
import { PaginationControlsComponent } from '../../shared/components/pagination-controls/pagination-controls';
import { toDateInputValue } from '../../shared/utils/date/date.util';
import { periodDateRangeValidator } from '../../shared/utils/form-validators/form-validators';
import { getErrorMessage } from '../../shared/utils/http-error/http-error.util';
import {
  PeriodPurchaseFormGroup,
  PurchaseConfirmModalComponent,
} from '../../shared/components/purchase-confirm-modal/purchase-confirm-modal';
import {
  computePeriodTicketPrice,
  getOfferPriceCaption,
  getOfferTitle,
  getTicketTypeLabel,
} from '../../shared/utils/ticket-presentation/ticket-presentation.util';

@Component({
  selector: 'app-home-page',
  imports: [DecimalPipe, PaginationControlsComponent, PurchaseConfirmModalComponent],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePageComponent {
  protected readonly ticketTypeFilters = TICKET_TYPE_FILTER_OPTIONS;
  protected readonly offerPageSizeOptions = [4, 8, 20];
  protected readonly authStore = inject(AuthStoreService);

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly offersApi = inject(OffersApiService);
  private readonly ticketsApi = inject(TicketsApiService);
  private readonly accountApi = inject(AccountApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly offers = signal<TicketOfferResponse[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly purchaseMessage = signal<string | null>(null);
  protected readonly purchaseError = signal<string | null>(null);
  protected readonly purchasePendingOfferId = signal<number | null>(null);
  protected readonly selectedPurchaseOffer = signal<TicketOfferResponse | null>(null);
  protected readonly selectedTicketTypes = signal<TicketType[]>([]);
  protected readonly offerPage = signal(0);
  protected readonly offerPageSize = signal(8);
  protected readonly offerTotalElements = signal(0);
  protected readonly offerTotalPages = signal(0);
  protected readonly offerFirstPage = signal(true);
  protected readonly offerLastPage = signal(true);
  protected readonly hasOfferFilters = computed(() => this.selectedTicketTypes().length > 0);
  protected readonly emptyOfferSlots = computed(() => {
    if (this.offerTotalPages() <= 1) {
      return [];
    }

    const missingItems = this.offerPageSize() - this.offers().length;
    if (missingItems <= 0) {
      return [];
    }

    return Array.from({ length: missingItems }, (_, index) => index);
  });
  protected readonly minimumPeriodStart = signal(toDateInputValue(new Date()));
  protected readonly periodPurchaseForm: PeriodPurchaseFormGroup = this.formBuilder.group(
    {
      validFrom: ['', Validators.required],
      validTo: ['', Validators.required],
    },
    {
      validators: [periodDateRangeValidator('validFrom', 'validTo')],
    },
  );

  constructor() {
    this.loadOffers();
  }

  protected loadOffers(page = this.offerPage(), size = this.offerPageSize()): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const query: OffersQuery = {
      page,
      size,
      sort: 'id,asc',
      type: this.selectedTicketTypes().length > 0 ? this.selectedTicketTypes() : undefined,
    };

    this.offersApi
      .list(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (offersPage) => {
          this.applyOffersPage(offersPage);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'Nie udalo sie pobrac oferty biletowej.'));
          this.offers.set([]);
          this.offerTotalElements.set(0);
          this.offerTotalPages.set(0);
          this.offerFirstPage.set(true);
          this.offerLastPage.set(true);
          this.isLoading.set(false);
        },
      });
  }

  protected offerTitle(offer: TicketOfferResponse): string {
    return getOfferTitle(offer);
  }

  protected ticketTypeLabel(type: TicketType): string {
    return getTicketTypeLabel(type);
  }

  protected offerPriceCaption(offer: TicketOfferResponse): string | null {
    return getOfferPriceCaption(offer);
  }

  protected toggleTicketTypeFilter(type: TicketType): void {
    this.selectedTicketTypes.update((selectedTypes) =>
      selectedTypes.includes(type) ? selectedTypes.filter((selectedType) => selectedType !== type) : [...selectedTypes, type],
    );
    this.offerPage.set(0);
    this.loadOffers(0, this.offerPageSize());
  }

  protected isTicketTypeSelected(type: TicketType): boolean {
    return this.selectedTicketTypes().includes(type);
  }

  protected changeOfferPage(page: number): void {
    this.offerPage.set(page);
    this.loadOffers(page, this.offerPageSize());
  }

  protected changeOfferPageSize(size: number): void {
    this.offerPage.set(0);
    this.offerPageSize.set(size);
    this.loadOffers(0, size);
  }

  protected buyOffer(offer: TicketOfferResponse): void {
    this.purchaseMessage.set(null);
    this.purchaseError.set(null);

    const user = this.authStore.currentUser();

    if (!user) {
      void this.router.navigate(['/login']);
      return;
    }

    if (user.role !== 'PASSENGER') {
      void this.router.navigate(['/forbidden']);
      return;
    }

    this.openPurchaseModal(offer);
  }

  protected closePurchaseModal(): void {
    this.selectedPurchaseOffer.set(null);
    this.resetPeriodPurchaseForm();
  }

  protected confirmPurchase(): void {
    const offer = this.selectedPurchaseOffer();

    if (!offer) {
      return;
    }

    if (offer.type === 'PERIOD' && this.periodPurchaseForm.invalid) {
      this.periodPurchaseForm.markAllAsTouched();
      return;
    }

    this.purchaseOffer(offer, {
      offerId: offer.id,
      validFrom: offer.type === 'PERIOD' ? this.periodPurchaseForm.controls.validFrom.value : null,
      validTo: offer.type === 'PERIOD' ? this.periodPurchaseForm.controls.validTo.value : null,
    });
  }

  protected purchasePreviewPrice(): number | null {
    const offer = this.selectedPurchaseOffer();

    if (!offer) {
      return null;
    }

    if (offer.type !== 'PERIOD') {
      return offer.price;
    }

    return computePeriodTicketPrice(
      offer,
      this.periodPurchaseForm.controls.validFrom.value,
      this.periodPurchaseForm.controls.validTo.value,
    );
  }

  protected currentBalance(): number {
    return this.authStore.user()?.balance ?? 0;
  }

  protected balanceAfterPurchase(): number | null {
    const price = this.purchasePreviewPrice();

    if (price === null) {
      return null;
    }

    return Math.round((this.currentBalance() - price) * 100) / 100;
  }

  protected canConfirmPurchase(): boolean {
    const offer = this.selectedPurchaseOffer();

    if (!offer) {
      return false;
    }

    if (offer.type !== 'PERIOD') {
      return true;
    }

    return this.periodPurchaseForm.valid && this.purchasePreviewPrice() !== null;
  }

  private openPurchaseModal(offer: TicketOfferResponse): void {
    this.resetPeriodPurchaseForm();
    this.selectedPurchaseOffer.set(offer);
  }

  private resetPeriodPurchaseForm(): void {
    this.periodPurchaseForm.reset({
      validFrom: '',
      validTo: '',
    });
    this.periodPurchaseForm.markAsPristine();
    this.periodPurchaseForm.markAsUntouched();
  }

  private purchaseOffer(
    offer: TicketOfferResponse,
    payload: {
      offerId: number;
      validFrom: string | null;
      validTo: string | null;
    },
  ): void {
    this.purchasePendingOfferId.set(offer.id);

    this.ticketsApi
      .purchase(payload)
      .pipe(
        switchMap((ticket) =>
          this.accountApi.me().pipe(
            map((user) => ({ ticket, user })),
            catchError(() => of({ ticket, user: null })),
          ),
        ),
        finalize(() => this.purchasePendingOfferId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ ticket, user }) => {
          if (user) {
            this.authStore.updateUser(user);
          }

          this.purchaseMessage.set(`Zakup zakonczony. Kod biletu: ${ticket.code}`);
          this.closePurchaseModal();
        },
        error: (error) => {
          this.purchaseError.set(getErrorMessage(error, 'Zakup biletu nie powiodl sie.'));
        },
      });
  }

  private applyOffersPage(offersPage: {
    content: TicketOfferResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  }): void {
    this.offers.set(offersPage.content);
    this.offerPage.set(offersPage.page);
    this.offerPageSize.set(offersPage.size);
    this.offerTotalElements.set(offersPage.totalElements);
    this.offerTotalPages.set(offersPage.totalPages);
    this.offerFirstPage.set(offersPage.first);
    this.offerLastPage.set(offersPage.last);
  }
}
