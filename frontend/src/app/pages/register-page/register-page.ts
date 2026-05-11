import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { getRoleRouteLocation } from '../../core/routing/role-routing.util';
import { AuthApiService } from '../../core/services/api/auth-api.service';
import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { toDateInputValue } from '../../shared/utils/date/date.util';
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
  protected readonly maximumDateOfBirth = toDateInputValue(new Date());
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
          const target = getRoleRouteLocation(response.user.role);

          void this.router.navigate(target.commands, {
            replaceUrl: true,
          });
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'Nie udało się utworzyć konta.'));
        },
      });
  }
}
