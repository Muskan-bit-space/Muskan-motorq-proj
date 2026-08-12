/**
 * Vehicle model representing a single simulated vehicle's state.
 */
class Vehicle {
  /**
   * @param {string} vehicleId - Unique vehicle identifier (VIN)
   * @param {Object} initialState - Initial vehicle state
   */
  constructor(vehicleId, initialState = {}) {
    this.vehicleId = vehicleId;
    this.speed = initialState.speed ?? 0;
    this.fuelLevel = initialState.fuelLevel ?? 100;
    this.engineState = initialState.engineState ?? "OFF";
    this.odometer = initialState.odometer ?? 0;
  }

  /**
   * Update vehicle state based on speed delta
   * @param {number} speedDelta - Speed change amount
   */
  updateSpeed(speedDelta) {
    this.speed = Math.max(0, this.speed + speedDelta);
  }

  /**
   * Update fuel level
   * @param {number} fuelDelta - Fuel change amount (negative = consumption)
   */
  updateFuel(fuelDelta) {
    this.fuelLevel = Math.min(100, Math.max(0, this.fuelLevel + fuelDelta));
  }

  /**
   * Set engine state
   * @param {string} state - "ON" or "OFF"
   */
  setEngineState(state) {
    this.engineState = state;
    if (state === "OFF") {
      this.speed = 0;
    }
  }

  /**
   * Update odometer based on current speed
   * @param {number} deltaSeconds - Time elapsed since last update in seconds
   */
  updateOdometer(deltaSeconds) {
    if (this.engineState === "ON" && this.speed > 0) {
      const milesPerSecond = this.speed / 3600;
      this.odometer += milesPerSecond * deltaSeconds;
    }
  }

  /**
   * Get current vehicle state
   * @returns {Object} Current vehicle state
   */
  getState() {
    return {
      vehicleId: this.vehicleId,
      speed: this.speed,
      fuelLevel: this.fuelLevel,
      engineState: this.engineState,
      odometer: Math.round(this.odometer)
    };
  }

  /**
   * Reset vehicle to default state
   */
  reset() {
    this.speed = 0;
    this.fuelLevel = 100;
    this.engineState = "OFF";
    this.odometer = 0;
  }
}

module.exports = Vehicle;