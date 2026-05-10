import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { of } from 'rxjs';

import { VehiclesApiService } from '../../../core/services/api/vehicles-api.service';
import { TicketValidationFormGroup, TicketValidationModalComponent } from './ticket-validation-modal';

describe('TicketValidationModalComponent', () => {
  const createForm = (vehicleQuery = '', vehicleId: number | null = 1): TicketValidationFormGroup =>
    new FormGroup({
      vehicleQuery: new FormControl(vehicleQuery, {
        nonNullable: true,
      }),
      vehicleId: new FormControl(vehicleId, {
        validators: [Validators.required],
      }),
    });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketValidationModalComponent],
      providers: [
        {
          provide: VehiclesApiService,
          useValue: {
            list: vi.fn(() =>
              of({
                content: [],
                page: 0,
                size: 6,
                totalElements: 0,
                totalPages: 0,
                first: true,
                last: true,
              }),
            ),
          },
        },
      ],
    }).compileComponents();
  });

  it('should render close x and centered submit action', () => {
    const fixture = TestBed.createComponent(TicketValidationModalComponent);
    fixture.componentRef.setInput('title', '30-minutowy normalny');
    fixture.componentRef.setInput('form', createForm());
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.modal-close-x')).not.toBeNull();
    expect(compiled.textContent).toContain('Skasuj bilet');
    expect(compiled.textContent).not.toContain('Anuluj');
    expect(compiled.textContent).not.toContain('Zamknij');
  });

  it('should emit close and submit events', () => {
    const fixture = TestBed.createComponent(TicketValidationModalComponent);
    fixture.componentRef.setInput('title', '30-minutowy normalny');
    fixture.componentRef.setInput('form', createForm());
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const closeSpy = vi.fn();
    const submitSpy = vi.fn();
    component.closeRequested.subscribe(closeSpy);
    component.submitRequested.subscribe(submitSpy);

    (fixture.nativeElement.querySelector('.modal-close-x') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy).toHaveBeenCalledTimes(1);
  });
});
