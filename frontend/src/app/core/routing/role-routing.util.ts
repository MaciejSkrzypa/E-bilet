import { Role } from '../models/api/api.models';

export interface RoleRouteLocation {
  commands: readonly [string];
}

export const PASSENGER_HOME_ROUTE = '/passenger/finance';

export function routeForRole(role: Role | null | undefined): string {
  return role === 'INSPECTOR' ? '/inspector' : PASSENGER_HOME_ROUTE;
}

export function getRoleRouteLocation(role: Role | null | undefined): RoleRouteLocation {
  return { commands: [routeForRole(role)] };
}
