const axios = require("axios");
const Transport = require("./Transport");

/**
 * HTTP Transport implementation for sending telemetry via HTTP POST.
 *
 * Handles connection failures and HTTP errors gracefully to prevent
 * the simulator from crashing on individual request failures.
 */
class HttpTransport extends Transport {
  /**
   * @param {Object} config - Transport configuration
   * @param {string} config.backendUrl - Base URL of the backend (e.g., "http://localhost:5000")
   * @param {string} config.endpoint - Telemetry endpoint (e.g., "/api/v1/telemetry")
   * @param {number} config.timeout - Request timeout in ms (default: 5000)
   */
  constructor(config = {}) {
    super();
    this.backendUrl = config.backendUrl || process.env.BACKEND_URL || "http://localhost:5000";
    this.endpoint = config.endpoint || process.env.TELEMETRY_ENDPOINT || "/api/v1/telemetry";
    this.timeout = config.timeout || 5000;
    this.url = `${this.backendUrl}${this.endpoint}`;
  }

  /**
   * Send telemetry via HTTP POST.
   * @param {Object} telemetry - Telemetry payload
   * @returns {Promise<Object>} { success: boolean, data?: any, error?: string }
   */
  async send(telemetry) {
    try {
      const response = await axios.post(this.url, telemetry, {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: this.timeout
      });

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      // Handle different error types gracefully
      if (error.code === "ECONNREFUSED") {
        return {
          success: false,
          error: `Connection refused: ${this.backendUrl}`
        };
      }

      if (error.code === "ENOTFOUND") {
        return {
          success: false,
          error: `Host not found: ${this.backendUrl}`
        };
      }

      if (error.code === "ETIMEDOUT") {
        return {
          success: false,
          error: `Request timeout after ${this.timeout}ms`
        };
      }

      // Handle HTTP error responses (4xx, 5xx)
      if (error.response) {
        return {
          success: false,
          status: error.response.status,
          error: `HTTP ${error.response.status}: ${error.response.data?.message || error.message}`
        };
      }

      // Unknown error
      return {
        success: false,
        error: error.message || "Unknown error"
      };
    }
  }

  /**
   * Check if backend is reachable.
   * @returns {Promise<boolean>}
   */
  async isConnected() {
    try {
      const healthUrl = `${this.backendUrl}/api/health`;
      await axios.get(healthUrl, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the full URL being used.
   * @returns {string}
   */
  getUrl() {
    return this.url;
  }
}

module.exports = HttpTransport;