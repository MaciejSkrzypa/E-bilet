import { TestBed } from '@angular/core/testing';

import { PaginationControlsComponent } from './pagination-controls';

describe('PaginationControlsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationControlsComponent],
    }).compileComponents();
  });

  it('should emit previous, next and size change events', () => {
    const fixture = TestBed.createComponent(PaginationControlsComponent);
    const component = fixture.componentInstance;
    const pageChanged = vi.fn();
    const sizeChanged = vi.fn();

    component.pageChanged.subscribe(pageChanged);
    component.sizeChanged.subscribe(sizeChanged);

    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('size', 10);
    fixture.componentRef.setInput('totalElements', 22);
    fixture.componentRef.setInput('totalPages', 3);
    fixture.componentRef.setInput('first', false);
    fixture.componentRef.setInput('last', false);
    fixture.detectChanges();

    const previousButton = fixture.nativeElement.querySelector('[data-role="prev"]') as HTMLButtonElement;
    const nextButton = fixture.nativeElement.querySelector('[data-role="next"]') as HTMLButtonElement;

    previousButton.click();
    nextButton.click();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = '20';
    select.dispatchEvent(new Event('change'));

    expect(pageChanged).toHaveBeenNthCalledWith(1, 0);
    expect(pageChanged).toHaveBeenNthCalledWith(2, 2);
    expect(sizeChanged).toHaveBeenCalledWith(20);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('11-20 z 22');
  });

  it('should not emit page changes when controls are disabled', () => {
    const fixture = TestBed.createComponent(PaginationControlsComponent);
    const component = fixture.componentInstance;
    const pageChanged = vi.fn();

    component.pageChanged.subscribe(pageChanged);

    fixture.componentRef.setInput('page', 0);
    fixture.componentRef.setInput('size', 10);
    fixture.componentRef.setInput('totalElements', 0);
    fixture.componentRef.setInput('totalPages', 0);
    fixture.componentRef.setInput('first', true);
    fixture.componentRef.setInput('last', true);
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();

    const previousButton = fixture.nativeElement.querySelector('[data-role="prev"]') as HTMLButtonElement;
    const nextButton = fixture.nativeElement.querySelector('[data-role="next"]') as HTMLButtonElement;

    previousButton.click();
    nextButton.click();

    expect(pageChanged).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('0 elementow');
  });

  it('should reflect page size changes coming from parent inputs', () => {
    const fixture = TestBed.createComponent(PaginationControlsComponent);

    fixture.componentRef.setInput('page', 0);
    fixture.componentRef.setInput('size', 5);
    fixture.componentRef.setInput('totalElements', 30);
    fixture.componentRef.setInput('totalPages', 6);
    fixture.componentRef.setInput('first', true);
    fixture.componentRef.setInput('last', false);
    fixture.detectChanges();

    fixture.componentRef.setInput('size', 10);
    fixture.componentRef.setInput('totalPages', 3);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('10');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('1-10 z 30');
  });

  it('should render all page buttons when page count is small and emit direct page selection', () => {
    const fixture = TestBed.createComponent(PaginationControlsComponent);
    const component = fixture.componentInstance;
    const pageChanged = vi.fn();

    component.pageChanged.subscribe(pageChanged);

    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('size', 10);
    fixture.componentRef.setInput('totalElements', 60);
    fixture.componentRef.setInput('totalPages', 6);
    fixture.componentRef.setInput('first', false);
    fixture.componentRef.setInput('last', false);
    fixture.detectChanges();

    const pageButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.pagination-page') as NodeListOf<HTMLButtonElement>,
    );

    expect(pageButtons.map((button) => button.textContent?.trim())).toEqual(['1', '2', '3', '4', '5', '6']);

    pageButtons[4].click();
    expect(pageChanged).toHaveBeenCalledWith(4);
  });

  it('should render a sliding window of pages for larger paginated results', () => {
    const fixture = TestBed.createComponent(PaginationControlsComponent);

    fixture.componentRef.setInput('page', 6);
    fixture.componentRef.setInput('size', 10);
    fixture.componentRef.setInput('totalElements', 1000);
    fixture.componentRef.setInput('totalPages', 100);
    fixture.componentRef.setInput('first', false);
    fixture.componentRef.setInput('last', false);
    fixture.detectChanges();

    const pageButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.pagination-page') as NodeListOf<HTMLButtonElement>,
    );

    expect(pageButtons.map((button) => button.textContent?.trim())).toEqual(['5', '6', '7', '8', '9']);
    expect(pageButtons[2].getAttribute('aria-current')).toBe('page');
  });
});
