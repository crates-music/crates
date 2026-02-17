import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent {
  message = '';
  submitted = false;
  submitting = false;
  error = '';

  constructor(private http: HttpClient) {}

  get characterCount(): number {
    return this.message.length;
  }

  onSubmit(): void {
    if (!this.message.trim() || this.submitting) return;

    this.submitting = true;
    this.error = '';

    this.http.post(`${environment.baseUri}/v1/feedback`, { message: this.message.trim() })
      .subscribe({
        next: () => {
          this.submitted = true;
          this.submitting = false;
        },
        error: () => {
          this.error = 'Failed to submit feedback. Please try again.';
          this.submitting = false;
        }
      });
  }
}
