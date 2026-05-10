import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { TicketOfferResponse } from '../../../core/models/api/api.models';
import { PeriodPurchaseFormGroup, PurchaseConfirmModalComponent } from './purchase-confirm-modal';

describe('PurchaseConfirmModalComponent', () => {
  const createForm = (): PeriodPurchaseFormGroup =>
    new FormGroup({
      validFrom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      validTo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });

  const periodOffer: TicketOfferResponse = {
    id: 3,
    type: 'PERIOD',
    fare: 'NORMAL',
    price: 5,
    durationMinutes: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseConfirmModalComponent],
    }).compileComponents();
  });

  it('should render modal with close x and centered submit action', () => {
    const fixture = TestBed.createComponent(PurchaseConfirmModalComponent);
    fixture.componentRef.setInput('offer', periodOffer);
    fixture.componentRef.setInput('offerTitle', 'Bilet okresowy normalny');
    fixture.componentRef.setInput('form', createForm());
    fixture.componentRef.setInput('minimumPeriodStart', '2099-01-01');
    fixture.componentRef.setInput('currentBalance', 20);
    fixture.componentRef.setInput('previewPrice', 35);
    fixture.componentRef.setInput('balanceAfterPurchase', -15);
    fixture.componentRef.setInput('canConfirm', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.modal-close-x')).not.toBeNull();
    expect(compiled.textContent).toContain('Potwierdz zakup');
    expect(compiled.textContent).not.toContain('Anuluj');
    expect(compiled.textContent).not.toContain('Zamknij');
  });

  it('should emit close and submit events', () => {
    const fixture = TestBed.createComponent(PurchaseConfirmModalComponent);
    fixture.componentRef.setInput('offer', periodOffer);
    fixture.componentRef.setInput('offerTitle', 'Bilet okresowy normalny');
    fixture.componentRef.setInput('form', createForm());
    fixture.componentRef.setInput('minimumPeriodStart', '2099-01-01');
    fixture.componentRef.setInput('currentBalance', 20);
    fixture.componentRef.setInput('previewPrice', 35);
    fixture.componentRef.setInput('balanceAfterPurchase', -15);
    fixture.componentRef.setInput('canConfirm', true);
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
