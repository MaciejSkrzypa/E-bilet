import { DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, finalize } from 'rxjs';

import { TopUpModalComponent } from './shared/components/top-up-modal/top-up-modal';
import { AccountApiService } from './core/services/api/account-api.service';
import { AuthStoreService } from './core/services/auth-store/auth-store.service';

interface NavItem {
  label: string;
  href: string;
  exact?: boolean;
}

@Component({
  selector: 'app-root',
  imports: [DecimalPipe, RouterLink, RouterOutlet, TopUpModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly presetTopUpAmounts = [10, 20, 50, 100];

  private readonly authStore = inject(AuthStoreService);
  private readonly accountApi = inject(AccountApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authStore.user;
  protected readonly brandRoute = computed(() => (this.currentUser()?.role === 'INSPECTOR' ? '/inspector' : '/'));
  protected readonly isTopUpModalOpen = signal(false);
  protected readonly topUpError = signal<string | null>(null);
  protected readonly isTopUpSubmitting = signal(false);
  protected readonly isPassenger = computed(() => this.currentUser()?.role === 'PASSENGER');
  protected readonly currentUrl = signal('/');
  protected readonly navItems = computed<NavItem[]>(() => {
    const user = this.currentUser();

    if (!user) {
      return [
        { label: 'Start', href: '/', exact: true },
        { label: 'Kasownik', href: '/kasownik' },
      ];
    }

    if (user.role === 'INSPECTOR') {
      return [
        { label: 'Sprawdź ważność biletu', href: '/inspector', exact: true },
        { label: 'O mnie', href: '/inspector/profile', exact: true },
      ];
    }

    return [
      { label: 'Start', href: '/', exact: true },
      { label: 'Kasownik', href: '/kasownik' },
      {
        label: 'Panel pasażera',
        href: '/passenger',
      },
    ];
  });
  protected readonly topUpForm = new FormGroup({
    amount: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01), Validators.max(10000)],
    }),
  });

  constructor() {
    this.currentUrl.set(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));

    if (this.authStore.isAuthenticated()) {
      this.accountApi
        .me()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (user) => this.authStore.updateUser(user),
          error: () => undefined,
        });
    }
  }

  protected isNavItemActive(item: NavItem): boolean {
    const currentUrl = this.currentUrl();
    const targetUrl = this.router.serializeUrl(
      this.router.createUrlTree([item.href]),
    );

    return item.exact ? currentUrl === targetUrl : currentUrl.startsWith(targetUrl);
  }

  protected logout(): void {
    this.authStore.logout();
  }

  protected openTopUpModal(): void {
    if (!this.isPassenger()) {
      return;
    }

    this.topUpError.set(null);
    this.resetTopUpForm();
    this.isTopUpModalOpen.set(true);
  }

  protected closeTopUpModal(): void {
    this.isTopUpModalOpen.set(false);
    this.topUpError.set(null);
    this.resetTopUpForm();
  }

  protected selectTopUpAmount(amount: number): void {
    this.topUpForm.controls.amount.setValue(amount);
    this.topUpForm.controls.amount.markAsTouched();
    this.topUpForm.controls.amount.markAsDirty();
  }

  protected submitTopUp(): void {
    if (this.topUpForm.invalid) {
      this.topUpForm.markAllAsTouched();
      return;
    }

    const amount = this.topUpForm.controls.amount.value;

    this.isTopUpSubmitting.set(true);
    this.topUpError.set(null);

    this.accountApi
      .topUp({ amount })
      .pipe(finalize(() => this.isTopUpSubmitting.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.authStore.updateUser(user);
          this.closeTopUpModal();
        },
        error: () => {
          this.topUpError.set('Nie udało się doładować konta.');
        },
      });
  }

  private resetTopUpForm(): void {
    this.topUpForm.reset({ amount: 0 });
    this.topUpForm.markAsPristine();
    this.topUpForm.markAsUntouched();
  }
}
