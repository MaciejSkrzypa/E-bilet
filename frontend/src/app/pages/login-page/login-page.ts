import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Role } from '../../core/models/api/api.models';
import { getRoleRouteLocation } from '../../core/routing/role-routing.util';
import { AuthApiService } from '../../core/services/api/auth-api.service';
import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { getErrorMessage } from '../../shared/utils/http-error/http-error.util';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authApi
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.authStore.login(response);
          void this.navigateAfterLogin(response.user.role);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'Nie udalo sie zalogowac.'));
        },
      });
  }

  private navigateAfterLogin(role: Role): Promise<boolean> {
    const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');

    if (redirectTo && redirectTo.startsWith('/')) {
      return this.router.navigateByUrl(redirectTo, { replaceUrl: true });
    }

    const target = getRoleRouteLocation(role);
    return this.router.navigate(target.commands, {
      replaceUrl: true,
    });
  }
}
