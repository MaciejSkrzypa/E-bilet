import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination-controls',
  templateUrl: './pagination-controls.html',
  styleUrl: './pagination-controls.scss',
})
export class PaginationControlsComponent {
  private static readonly MAX_VISIBLE_PAGES = 5;

  readonly page = input.required<number>();
  readonly size = input.required<number>();
  readonly totalElements = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly first = input.required<boolean>();
  readonly last = input.required<boolean>();
  readonly isLoading = input(false);
  readonly density = input<'default' | 'compact'>('default');
  readonly sizeOptions = input<readonly number[]>([5, 10, 20, 50, 100]);
  readonly itemLabel = input('elementow');

  readonly pageChanged = output<number>();
  readonly sizeChanged = output<number>();

  protected previousPage(): void {
    if (this.first() || this.isLoading()) {
      return;
    }

    this.pageChanged.emit(this.page() - 1);
  }

  protected nextPage(): void {
    if (this.last() || this.isLoading()) {
      return;
    }

    this.pageChanged.emit(this.page() + 1);
  }

  protected goToPage(pageNumber: number): void {
    if (
      this.isLoading() ||
      pageNumber < 0 ||
      pageNumber >= this.totalPages() ||
      pageNumber === this.page()
    ) {
      return;
    }

    this.pageChanged.emit(pageNumber);
  }

  protected updateSize(value: string): void {
    const parsedValue = Number(value);

    if (Number.isNaN(parsedValue) || parsedValue <= 0 || this.isLoading()) {
      return;
    }

    this.sizeChanged.emit(parsedValue);
  }

  protected rangeStart(): number {
    if (this.totalElements() === 0) {
      return 0;
    }

    return this.page() * this.size() + 1;
  }

  protected rangeEnd(): number {
    return Math.min((this.page() + 1) * this.size(), this.totalElements());
  }

  protected visiblePages(): number[] {
    const totalPages = this.totalPages();
    if (totalPages <= 0) {
      return [];
    }

    if (totalPages <= PaginationControlsComponent.MAX_VISIBLE_PAGES + 1) {
      return Array.from({ length: totalPages }, (_, index) => index);
    }

    const currentPage = this.page();
    const maxVisiblePages = PaginationControlsComponent.MAX_VISIBLE_PAGES;

    if (currentPage <= 2) {
      return Array.from({ length: maxVisiblePages }, (_, index) => index);
    }

    if (currentPage >= totalPages - 3) {
      return Array.from({ length: maxVisiblePages }, (_, index) => totalPages - maxVisiblePages + index);
    }

    return Array.from({ length: maxVisiblePages }, (_, index) => currentPage - 2 + index);
  }
}
