import { Routes } from '@angular/router';

import { authGuard, guestOnlyGuard, inspectorPublicRedirectGuard, roleGuard } from './core/guards/auth/auth.guards';
import {
  passengerTicketsResolver,
  passengerTransactionsResolver,
} from './core/resolvers/passenger-dashboard/passenger-dashboard.resolver';

export const routes: Routes = [
  {
    path: '',
    canActivate: [inspectorPublicRedirectGuard],
    loadComponent: () => import('./pages/home-page/home-page').then((m) => m.HomePageComponent),
  },
  {
    path: 'login',
    canActivate: [guestOnlyGuard],
    loadComponent: () => import('./pages/login-page/login-page').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    canActivate: [guestOnlyGuard],
    loadComponent: () => import('./pages/register-page/register-page').then((m) => m.RegisterPageComponent),
  },
  {
    path: 'passenger',
    canActivate: [authGuard, roleGuard('PASSENGER')],
    loadComponent: () =>
      import('./pages/passenger-dashboard-page/passenger-dashboard-page').then((m) => m.PassengerDashboardPageComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'finance',
      },
      {
        path: 'finance',
        resolve: {
          finance: passengerTransactionsResolver,
        },
        loadComponent: () =>
          import('./pages/passenger-dashboard-page/passenger-finance-section').then(
            (m) => m.PassengerFinanceSectionComponent,
          ),
      },
      {
        path: 'tickets',
        resolve: {
          tickets: passengerTicketsResolver,
        },
        loadComponent: () =>
          import('./pages/passenger-dashboard-page/passenger-tickets-section').then(
            (m) => m.PassengerTicketsSectionComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/passenger-dashboard-page/passenger-profile-section').then(
            (m) => m.PassengerProfileSectionComponent,
          ),
      },
    ],
  },
  {
    path: 'inspector',
    canActivate: [authGuard, roleGuard('INSPECTOR')],
    data: {
      section: 'check',
    },
    loadComponent: () =>
      import('./pages/inspector-dashboard-page/inspector-dashboard-page').then((m) => m.InspectorDashboardPageComponent),
  },
  {
    path: 'inspector/profile',
    canActivate: [authGuard, roleGuard('INSPECTOR')],
    data: {
      section: 'profile',
    },
    loadComponent: () =>
      import('./pages/inspector-dashboard-page/inspector-dashboard-page').then((m) => m.InspectorDashboardPageComponent),
  },
  {
    path: 'kasownik',
    canActivate: [authGuard, roleGuard('PASSENGER')],
    loadComponent: () => import('./pages/kasownik-page/kasownik-page').then((m) => m.KasownikPageComponent),
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./pages/forbidden-page/forbidden-page').then((m) => m.ForbiddenPageComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
