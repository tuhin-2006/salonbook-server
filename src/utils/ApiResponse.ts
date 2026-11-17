export class ApiResponse<T = unknown> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;

  constructor(statusCode: number, data: T, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
