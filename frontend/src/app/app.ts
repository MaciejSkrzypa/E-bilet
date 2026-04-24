import { HttpClient } from '@angular/common/http';
import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

interface HealthResponse {
  status: string;
  number: number;
}

@Component({
  selector: 'app-root',
  imports: [JsonPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = 'City Ticket Health Check';
  protected readonly health = signal<HealthResponse | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private readonly http = inject(HttpClient);
  private readonly healthUrl = `${window.location.protocol}//${window.location.hostname}:8080/health`;

  protected fetchHealth(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<HealthResponse>(this.healthUrl).subscribe({
      next: (response) => {
        this.health.set(response);
        this.isLoading.set(false);
      },
      error: () => {
        this.health.set(null);
        this.errorMessage.set('Could not reach backend health endpoint.');
        this.isLoading.set(false);
      }
    });
  }
}
