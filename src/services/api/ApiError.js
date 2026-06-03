export class ApiError extends Error {
  constructor(message, data = null, status = 0) {
    super(message);
    this.name = "ApiError";
    this.data = data;
    this.status = status;
  }
}
