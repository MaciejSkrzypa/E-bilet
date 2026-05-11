import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface PassengerSectionTab {
  label: string;
  href: string;
}

@Component({
  selector: 'app-passenger-dashboard-page',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './passenger-dashboard-page.html',
  styleUrl: './passenger-dashboard-page.scss',
})
export class PassengerDashboardPageComponent {
  protected readonly sectionTabs: readonly PassengerSectionTab[] = [
    { label: 'Historia finansowa', href: '/passenger/finance' },
    { label: 'Moje bilety', href: '/passenger/tickets' },
    { label: 'O mnie', href: '/passenger/profile' },
  ];
}
