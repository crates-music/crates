export class ApiError {
  timestamp?: string;
  status?: number;
  error: string;
  exception?: string;
  path?: string;

  constructor(message?: string) {
    if (message) {
      this._message = message;
    }
  }

  private _message: string;

  get message() {
    if (!this._message || this._message === 'No message available') {
      return 'Server Error. Please Try Again.';
    }
    return this._message;
  }

  set message(value: string) {
    this._message = value;
  }
}
