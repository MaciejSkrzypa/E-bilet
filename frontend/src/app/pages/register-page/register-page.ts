import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { routeForRole } from '../../core/guards/auth/auth.guards';
import { AuthApiService } from '../../core/services/api/auth-api.service';
import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { matchingFieldsValidator } from '../../shared/utils/form-validators/form-validators';
import { getErrorMessage } from '../../shared/utils/http-error/http-error.util';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly maximumDateOfBirth = this.toDateInputValue(new Date());
  protected readonly form = this.formBuilder.group(
    {
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      firstName: ['', [Validators.required, Validators.maxLength(64)]],
      lastName: ['', [Validators.required, Validators.maxLength(64)]],
      dateOfBirth: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(128)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: [matchingFieldsValidator('password', 'confirmPassword')],
    },
  );

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, firstName, lastName, dateOfBirth, password } = this.form.getRawValue();

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authApi
      .register({ email, firstName, lastName, dateOfBirth, password })
      .pipe(
        switchMap(() => this.authApi.login({ email, password })),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.authStore.login(response);
          void this.router.navigate([routeForRole(response.user.role)], {
            fragment: response.user.role === 'PASSENGER' ? 'finance' : undefined,
            replaceUrl: true,
          });
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'Nie udalo sie utworzyc konta.'));
        },
      });
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
