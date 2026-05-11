import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { Role } from '../../models/api/api.models';
import { getRoleRouteLocation } from '../../routing/role-routing.util';
import { AuthStoreService } from '../../services/auth-store/auth-store.service';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  return authStore.isAuthenticated() ? true : router.createUrlTree(['/']);
};

export const guestOnlyGuard: CanActivateFn = () => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);
  const user = authStore.currentUser();

  if (!user) {
    return true;
  }

  const target = getRoleRouteLocation(user.role);
  return router.createUrlTree(target.commands);
};

export function roleGuard(expectedRole: Role): CanActivateFn {
  return () => {
    const authStore = inject(AuthStoreService);
    const router = inject(Router);
    const user = authStore.currentUser();

    if (!authStore.isAuthenticated()) {
      return router.createUrlTree(['/']);
    }

    if (authStore.hasRole(expectedRole)) {
      return true;
    }

    const target = getRoleRouteLocation(user?.role);
    return router.createUrlTree(target.commands);
  };
}

export const inspectorPublicRedirectGuard: CanActivateFn = () => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  return authStore.currentUser()?.role === 'INSPECTOR' ? router.createUrlTree(['/inspector']) : true;
};
