import { computed, Injectable, signal } from '@angular/core';

import { AuthSession, LoginResponse, Role, UserResponse } from '../../models/api/api.models';

@Injectable({ providedIn: 'root' })
export class AuthStoreService {
  private readonly storageKey = 'city-ticket.session';
  private readonly storage = typeof localStorage === 'undefined' ? null : localStorage;
  private readonly state = signal<AuthSession | null>(this.readPersistedSession());

  readonly session = this.state.asReadonly();
  readonly user = computed(() => this.state()?.user ?? null);
  readonly role = computed(() => this.state()?.user.role ?? null);
  readonly isLoggedIn = computed(() => this.hasValidSession(this.state()));

  login(response: LoginResponse): void {
    const session: AuthSession = {
      token: response.token,
      expiresAt: response.expiresAt,
      user: response.user,
    };

    this.setSession(session);
  }

  updateUser(user: UserResponse): void {
    const session = this.requireValidSession();

    if (!session) {
      return;
    }

    this.setSession({
      ...session,
      user,
    });
  }

  token(): string | null {
    return this.requireValidSession()?.token ?? null;
  }

  currentUser(): UserResponse | null {
    return this.requireValidSession()?.user ?? null;
  }

  isAuthenticated(): boolean {
    return this.requireValidSession() !== null;
  }

  hasRole(role: Role): boolean {
    return this.currentUser()?.role === role;
  }

  logout(): void {
    this.state.set(null);
    this.storage?.removeItem(this.storageKey);
  }

  private setSession(session: AuthSession): void {
    this.state.set(session);
    this.storage?.setItem(this.storageKey, JSON.stringify(session));
  }

  private requireValidSession(): AuthSession | null {
    const session = this.state();

    if (!this.hasValidSession(session)) {
      this.logout();
      return null;
    }

    return session;
  }

  private hasValidSession(session: AuthSession | null): session is AuthSession {
    return !!session && Date.parse(session.expiresAt) > Date.now();
  }

  private readPersistedSession(): AuthSession | null {
    if (!this.storage) {
      return null;
    }

    const rawValue = this.storage.getItem(this.storageKey);

    if (!rawValue) {
      return null;
    }

    try {
      const session = JSON.parse(rawValue) as Partial<AuthSession>;

      if (
        typeof session.token !== 'string' ||
        typeof session.expiresAt !== 'string' ||
        !session.user ||
        typeof session.user.email !== 'string' ||
        typeof session.user.firstName !== 'string' ||
        typeof session.user.lastName !== 'string' ||
        typeof session.user.dateOfBirth !== 'string' ||
        typeof session.user.role !== 'string' ||
        typeof session.user.balance !== 'number'
      ) {
        this.storage.removeItem(this.storageKey);
        return null;
      }

      return Date.parse(session.expiresAt) > Date.now() ? (session as AuthSession) : null;
    } catch {
      this.storage.removeItem(this.storageKey);
      return null;
    }
  }
}
