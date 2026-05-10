import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { Role } from '../../models/api/api.models';
import { AuthStoreService } from '../../services/auth-store/auth-store.service';

export function routeForRole(role: Role | null | undefined): string {
  return role === 'INSPECTOR' ? '/inspector' : '/passenger';
}

export function fragmentForRole(role: Role | null | undefined): string | null {
  return role === 'PASSENGER' || role == null ? 'finance' : null;
}

export const authGuard: CanActivateFn = (_, state) => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  return authStore.isAuthenticated()
    ? true
    : router.createUrlTree(['/']);
};

export const guestOnlyGuard: CanActivateFn = () => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);
  const user = authStore.currentUser();

  return user
    ? router.createUrlTree([routeForRole(user.role)], {
        fragment: fragmentForRole(user.role) ?? undefined,
      })
    : true;
};

export function roleGuard(expectedRole: Role): CanActivateFn {
  return () => {
    const authStore = inject(AuthStoreService);
    const router = inject(Router);
    const user = authStore.currentUser();

    if (!authStore.isAuthenticated()) {
      return router.createUrlTree(['/']);
    }

    return authStore.hasRole(expectedRole)
      ? true
      : router.createUrlTree([routeForRole(user?.role)], {
          fragment: fragmentForRole(user?.role) ?? undefined,
        });
  };
}

export const inspectorPublicRedirectGuard: CanActivateFn = () => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  return authStore.currentUser()?.role === 'INSPECTOR' ? router.createUrlTree(['/inspector']) : true;
};
