import { Component, computed, inject } from '@angular/core';

import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { buildUserProfileFields } from '../../shared/utils/user-presentation/user-presentation.util';

@Component({
  selector: 'app-passenger-profile-section',
  templateUrl: './passenger-profile-section.html',
  styleUrl: './passenger-dashboard-sections.scss',
})
export class PassengerProfileSectionComponent {
  private readonly authStore = inject(AuthStoreService);

  protected readonly profileFields = computed(() => buildUserProfileFields(this.authStore.user()));
}
