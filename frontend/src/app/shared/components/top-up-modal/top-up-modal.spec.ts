import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { TopUpFormGroup, TopUpModalComponent } from './top-up-modal';

describe('TopUpModalComponent', () => {
  const createForm = (amount = 0): TopUpFormGroup =>
    new FormGroup({
      amount: new FormControl(amount, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0.01), Validators.max(10000)],
      }),
    });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopUpModalComponent],
    }).compileComponents();
  });

  it('should emit selected preset amount', () => {
    const fixture = TestBed.createComponent(TopUpModalComponent);
    fixture.componentRef.setInput('presetAmounts', [10, 20, 50, 100]);
    fixture.componentRef.setInput('form', createForm());
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const spy = vi.fn();
    component.presetSelected.subscribe(spy);

    const presetButtons = fixture.nativeElement.querySelectorAll('.preset-button') as NodeListOf<HTMLButtonElement>;
    presetButtons[1].click();

    expect(spy).toHaveBeenCalledWith(20);
  });

  it('should emit close request from backdrop and close button', () => {
    const fixture = TestBed.createComponent(TopUpModalComponent);
    fixture.componentRef.setInput('presetAmounts', [10, 20]);
    fixture.componentRef.setInput('form', createForm());
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const spy = vi.fn();
    component.closeRequested.subscribe(spy);

    (fixture.nativeElement.querySelector('.modal-close-x') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.modal-backdrop') as HTMLDivElement).click();

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should disable submit button for invalid amount and show error message input', () => {
    const fixture = TestBed.createComponent(TopUpModalComponent);
    const form = createForm(-5);

    form.controls.amount.markAsTouched();

    fixture.componentRef.setInput('presetAmounts', [10, 20]);
    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('error', 'Nie udało się doładować konta.');
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector('.action-button') as HTMLButtonElement;
    const compiled = fixture.nativeElement as HTMLElement;

    expect(form.invalid).toBe(true);
    expect(submitButton.disabled).toBe(true);
    expect(compiled.textContent).toContain('Kwota musi być większa od 0.00 PLN.');
    expect(compiled.textContent).toContain('Nie udało się doładować konta.');
  });

  it('should emit submit request on form submit', () => {
    const fixture = TestBed.createComponent(TopUpModalComponent);
    fixture.componentRef.setInput('presetAmounts', [10, 20]);
    fixture.componentRef.setInput('form', createForm(20));
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const spy = vi.fn();
    component.submitRequested.subscribe(spy);

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
