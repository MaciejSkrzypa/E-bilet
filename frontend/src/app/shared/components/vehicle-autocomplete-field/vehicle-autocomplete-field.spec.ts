import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { of } from 'rxjs';

import { VehiclesApiService } from '../../../core/services/api/vehicles-api.service';
import { VehicleAutocompleteFieldComponent } from './vehicle-autocomplete-field';

describe('VehicleAutocompleteFieldComponent', () => {
  it('should fetch matching vehicles and set selected vehicle id after click', async () => {
    const list = vi.fn(() =>
      of({
        content: [
          { id: 1, label: 'T-100' },
          { id: 2, label: 'T-101' },
        ],
        page: 0,
        size: 6,
        totalElements: 2,
        totalPages: 1,
        first: true,
        last: true,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [VehicleAutocompleteFieldComponent],
      providers: [
        {
          provide: VehiclesApiService,
          useValue: { list },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(VehicleAutocompleteFieldComponent);
    const queryControl = new FormControl('', { nonNullable: true });
    const vehicleIdControl = new FormControl<number | null>(null);

    fixture.componentRef.setInput('queryControl', queryControl);
    fixture.componentRef.setInput('vehicleIdControl', vehicleIdControl);
    fixture.detectChanges();

    queryControl.setValue('T-10');
    await new Promise((resolve) => setTimeout(resolve, 220));
    fixture.detectChanges();

    expect(list).toHaveBeenCalledWith({
      query: 'T-10',
      size: 6,
      sort: 'label,asc',
    });

    const suggestion = fixture.nativeElement.querySelector('.vehicle-picker__suggestion') as HTMLButtonElement;
    suggestion.click();
    fixture.detectChanges();

    expect(queryControl.value).toBe('T-100');
    expect(vehicleIdControl.value).toBe(1);
  });
});
