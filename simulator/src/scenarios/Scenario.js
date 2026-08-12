/**
 * Base scenario interface.
 * Scenarios modify vehicle state over time to generate realistic telemetry.
 */
class Scenario {
  /**
   * @param {string} name - Scenario name for logging
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Apply scenario behavior to vehicle state.
   * Called once per simulation tick.
   * @param {Vehicle} vehicle - The vehicle to modify
   * @param {number} deltaSeconds - Time since last tick in seconds
   */
  apply(vehicle, deltaSeconds) {
    throw new Error("Scenario.apply() must be implemented");
  }

  /**
   * Check if scenario has completed (for one-time scenarios)
   * @returns {boolean}
   */
  isComplete() {
    return false;
  }

  /**
   * Reset scenario state for reuse
   */
  reset() {}
}

module.exports = Scenario;