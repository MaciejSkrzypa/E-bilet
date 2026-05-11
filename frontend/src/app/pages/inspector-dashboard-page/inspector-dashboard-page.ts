import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { InspectionResponse, TicketResponse, TicketType } from '../../core/models/api/api.models';
import { InspectionApiService } from '../../core/services/api/inspection-api.service';
import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { VehicleAutocompleteFieldComponent } from '../../shared/components/vehicle-autocomplete-field/vehicle-autocomplete-field';
import { uuidPattern } from '../../shared/utils/form-validators/form-validators';
import { getErrorMessage } from '../../shared/utils/http-error/http-error.util';
import { getInspectionReasonLabel } from '../../shared/utils/inspection-presentation/inspection-presentation.util';
import { getTicketTitle, getTicketTypeLabel } from '../../shared/utils/ticket-presentation/ticket-presentation.util';
import { buildUserProfileFields } from '../../shared/utils/user-presentation/user-presentation.util';

type InspectorSection = 'check' | 'profile';

@Component({
  selector: 'app-inspector-dashboard-page',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, VehicleAutocompleteFieldComponent],
  templateUrl: './inspector-dashboard-page.html',
  styleUrl: './inspector-dashboard-page.scss',
})
export class InspectorDashboardPageComponent {
  private readonly inspectionApi = inject(InspectionApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly authStore = inject(AuthStoreService);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly result = signal<InspectionResponse | null>(null);
  protected readonly currentSection = signal<InspectorSection>('check');
  protected readonly form = new FormGroup<{
    code: FormControl<string>;
    vehicleQuery: FormControl<string>;
    vehicleId: FormControl<number | null>;
  }>({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(uuidPattern)],
    }),
    vehicleQuery: new FormControl('', {
      nonNullable: true,
    }),
    vehicleId: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
  });
  protected readonly profileFields = computed(() => buildUserProfileFields(this.authStore.user()));

  constructor() {
    this.currentSection.set(this.normalizeSection(this.route.snapshot.data['section'] as string | undefined));
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.currentSection.set(this.normalizeSection(data['section'] as string | undefined));
    });
  }

  protected ticketTypeLabel(type: TicketType): string {
    return getTicketTypeLabel(type);
  }

  protected ticketTitle(ticket: TicketResponse): string {
    return getTicketTitle(ticket);
  }

  protected inspectionReasonLabel(reason: string): string {
    return getInspectionReasonLabel(reason);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { code, vehicleId } = this.form.getRawValue();

    this.inspectionApi
      .check({
        code,
        vehicleId: vehicleId as number,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.result.set(response);
        },
        error: (error) => {
          this.result.set(null);
          this.errorMessage.set(getErrorMessage(error, 'Kontrola biletu nie powiodla sie.'));
        },
      });
  }

  private normalizeSection(value: string | undefined): InspectorSection {
    return value === 'profile' ? 'profile' : 'check';
  }
}
