/**
 * Abstract Transport interface.
 * Defines the contract for sending telemetry data.
 *
 * Implementations: HttpTransport, WebSocketTransport (future)
 */
class Transport {
  /**
   * Send telemetry data.
   * @param {Object} telemetry - Telemetry payload
   * @returns {Promise<Object>} Response from transport
   */
  async send(telemetry) {
    throw new Error("Transport.send() must be implemented");
  }

  /**
   * Check if transport is connected/ready.
   * @returns {Promise<boolean>}
   */
  async isConnected() {
    throw new Error("Transport.isConnected() must be implemented");
  }

  /**
   * Close/cleanup transport connection.
   */
  async close() {
    // Default no-op
  }
}

module.exports = Transport;