import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, ElementRef, HostListener, inject, input, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, of, startWith, switchMap } from 'rxjs';

import { VehicleResponse } from '../../../core/models/api/api.models';
import { VehiclesApiService } from '../../../core/services/api/vehicles-api.service';
import { getErrorMessage } from '../../utils/http-error/http-error.util';

const VEHICLE_SUGGESTIONS_PAGE_SIZE = 6;

export type VehicleQueryControl = FormControl<string>;
export type VehicleIdControl = FormControl<number | null>;

@Component({
  selector: 'app-vehicle-autocomplete-field',
  imports: [ReactiveFormsModule],
  templateUrl: './vehicle-autocomplete-field.html',
  styleUrl: './vehicle-autocomplete-field.scss',
})
export class VehicleAutocompleteFieldComponent implements OnInit {
  readonly label = input('Identyfikator pojazdu');
  readonly placeholder = input('Zacznij wpisywac, np. T-100');
  readonly centered = input(false);
  readonly queryControl = input.required<VehicleQueryControl>();
  readonly vehicleIdControl = input.required<VehicleIdControl>();

  private readonly vehiclesApi = inject(VehiclesApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly suggestions = signal<VehicleResponse[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isOpen = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const queryControl = this.queryControl();

    queryControl.valueChanges
      .pipe(
        startWith(queryControl.value),
        map((value) => value.trim()),
        debounceTime(180),
        distinctUntilChanged(),
        switchMap((query) => this.loadSuggestions(query)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ query, vehicles }) => {
        this.suggestions.set(vehicles);
        this.isOpen.set(query.length > 0);

        const exactMatch = vehicles.find((vehicle) => vehicle.label.toLowerCase() === query.toLowerCase()) ?? null;
        if (exactMatch) {
          this.vehicleIdControl().setValue(exactMatch.id, { emitEvent: false });
          return;
        }

        if (query.length > 0) {
          this.vehicleIdControl().setValue(null, { emitEvent: false });
        }
      });
  }

  protected selectVehicle(vehicle: VehicleResponse): void {
    this.queryControl().setValue(vehicle.label, { emitEvent: false });
    this.vehicleIdControl().setValue(vehicle.id, { emitEvent: false });
    this.suggestions.set([]);
    this.isOpen.set(false);
    this.errorMessage.set(null);
  }

  protected shouldShowSuggestions(): boolean {
    return this.isOpen() && this.queryControl().value.trim().length > 0 && this.suggestions().length > 0;
  }

  protected shouldShowNoResults(): boolean {
    return (
      this.isOpen() &&
      this.queryControl().value.trim().length > 0 &&
      this.suggestions().length === 0 &&
      !this.isLoading() &&
      !this.errorMessage() &&
      this.vehicleIdControl().value === null
    );
  }

  protected shouldShowDropdown(): boolean {
    if (!this.isOpen()) {
      return false;
    }

    const query = this.queryControl().value.trim();
    return query.length > 0 && (this.isLoading() || this.errorMessage() !== null || this.suggestions().length > 0 || this.shouldShowNoResults());
  }

  protected openDropdown(): void {
    if (this.queryControl().value.trim().length === 0) {
      return;
    }

    this.isOpen.set(true);
  }

  protected closeDropdown(): void {
    this.isOpen.set(false);
  }

  protected shouldShowValidationError(): boolean {
    return this.vehicleIdControl().invalid && (this.vehicleIdControl().touched || this.queryControl().touched);
  }

  @HostListener('document:pointerdown', ['$event'])
  protected handleDocumentPointerDown(event: PointerEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeDropdown();
    }
  }

  private loadSuggestions(query: string) {
    this.errorMessage.set(null);

    if (query.length === 0) {
      this.suggestions.set([]);
      this.isOpen.set(false);
      this.vehicleIdControl().setValue(null, { emitEvent: false });
      return of({ query, vehicles: [] as VehicleResponse[] });
    }

    this.isLoading.set(true);

    return this.vehiclesApi
      .list({
        query,
        size: VEHICLE_SUGGESTIONS_PAGE_SIZE,
        sort: 'label,asc',
      })
      .pipe(
        map((vehiclesPage) => ({ query, vehicles: vehiclesPage.content })),
        catchError((error) => {
          this.errorMessage.set(getErrorMessage(error, 'Nie udalo sie pobrac listy pojazdow.'));
          return of({ query, vehicles: [] as VehicleResponse[] });
        }),
        finalize(() => this.isLoading.set(false)),
      );
  }
}
