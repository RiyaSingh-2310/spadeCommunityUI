export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {unknown} [data]
   * @param {number} [status]
   * @param {{ sessionExpired?: boolean }} [options]
   */
  constructor(message, data = null, status = 0, { sessionExpired = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.data = data;
    this.status = status;
    this.sessionExpired = sessionExpired;
  }
}
