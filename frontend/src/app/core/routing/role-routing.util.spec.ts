import { getRoleRouteLocation, PASSENGER_HOME_ROUTE, routeForRole } from './role-routing.util';

describe('role routing util', () => {
  it('should resolve route by role', () => {
    expect(routeForRole('PASSENGER')).toBe(PASSENGER_HOME_ROUTE);
    expect(routeForRole('INSPECTOR')).toBe('/inspector');
    expect(routeForRole(null)).toBe(PASSENGER_HOME_ROUTE);
  });

  it('should build location for role home page', () => {
    expect(getRoleRouteLocation('PASSENGER')).toEqual({
      commands: [PASSENGER_HOME_ROUTE],
    });
    expect(getRoleRouteLocation('INSPECTOR')).toEqual({
      commands: ['/inspector'],
    });
  });
});
