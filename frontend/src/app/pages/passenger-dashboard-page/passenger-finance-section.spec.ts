import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { AccountApiService } from '../../core/services/api/account-api.service';
import { PassengerFinanceSectionComponent } from './passenger-finance-section';

describe('PassengerFinanceSectionComponent', () => {
  function createTransactionsPage(content: any[] = [], page = 0, size = 5, totalElements = content.length) {
    return {
      content,
      page,
      size,
      totalElements,
      totalPages: totalElements === 0 ? 0 : Math.ceil(totalElements / size),
      first: page === 0,
      last: (page + 1) * size >= totalElements,
    };
  }

  it('should render resolved transactions without extra startup request', async () => {
    const transactions = vi.fn();

    await TestBed.configureTestingModule({
      imports: [PassengerFinanceSectionComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                finance: {
                  transactionsPage: createTransactionsPage([
                    { id: 1, type: 'TOPUP', amount: 25, createdAt: '2026-05-09T10:00:00', ticketId: null, ticketCode: null },
                  ]),
                  errorMessage: null,
                },
              },
            },
          },
        },
        {
          provide: AccountApiService,
          useValue: {
            transactions,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PassengerFinanceSectionComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Transakcje konta');
    expect(compiled.textContent).toContain('Doładowanie');
    expect(compiled.textContent).toContain('25.00 PLN');
    expect(transactions).not.toHaveBeenCalled();
  });

  it('should request transactions again when page size changes', async () => {
    const transactions = vi.fn(() => of(createTransactionsPage([], 0, 10, 0)));

    await TestBed.configureTestingModule({
      imports: [PassengerFinanceSectionComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                finance: {
                  transactionsPage: createTransactionsPage(),
                  errorMessage: null,
                },
              },
            },
          },
        },
        {
          provide: AccountApiService,
          useValue: {
            transactions,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PassengerFinanceSectionComponent);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();

    component.changeTransactionPageSize(10);

    expect(transactions).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      sort: 'createdAt,desc',
    });
  });
});
