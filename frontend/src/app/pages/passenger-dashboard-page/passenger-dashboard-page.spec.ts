import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PassengerDashboardPageComponent } from './passenger-dashboard-page';

describe('PassengerDashboardPageComponent', () => {
  it('should render child route navigation for passenger sections', async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerDashboardPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(PassengerDashboardPageComponent);
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('.subnav-link')) as HTMLAnchorElement[];

    expect(links).toHaveLength(3);
    expect(links.map((link) => link.textContent?.trim())).toEqual(['Historia finansowa', 'Moje bilety', 'O mnie']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/passenger/finance',
      '/passenger/tickets',
      '/passenger/profile',
    ]);
  });
});
