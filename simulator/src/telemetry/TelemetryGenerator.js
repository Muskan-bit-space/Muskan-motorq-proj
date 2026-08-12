/**
 * TelemetryGenerator converts Vehicle state into the exact payload
 * expected by the backend API.
 *
 * This class knows NOTHING about HTTP, Express, MongoDB, or the backend.
 * It only transforms Vehicle state into a telemetry object.
 */
class TelemetryGenerator {
  /**
   * Generate telemetry payload from vehicle state.
   * @param {Vehicle} vehicle - The vehicle to generate telemetry from
   * @returns {Object} Telemetry payload matching backend schema
   */
  static generate(vehicle) {
    const state = vehicle.getState();

    return {
      vehicle_id: state.vehicleId,
      timestamp: new Date().toISOString(),
      speed_mph: Math.round(state.speed),
      fuel_level_percent: Math.round(state.fuelLevel),
      engine_state: state.engineState,
      odometer_miles: state.odometer
    };
  }

  /**
   * Validate telemetry payload against expected schema.
   * @param {Object} telemetry - Telemetry to validate
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validate(telemetry) {
    const errors = [];

    if (!telemetry.vehicle_id || typeof telemetry.vehicle_id !== "string") {
      errors.push("vehicle_id must be a non-empty string");
    }

    if (!telemetry.timestamp) {
      errors.push("timestamp is required");
    } else {
      const date = new Date(telemetry.timestamp);
      if (Number.isNaN(date.getTime())) {
        errors.push("timestamp must be a valid date");
      }
    }

    if (typeof telemetry.speed_mph !== "number" || telemetry.speed_mph < 0) {
      errors.push("speed_mph must be a number >= 0");
    }

    if (
      typeof telemetry.fuel_level_percent !== "number" ||
      telemetry.fuel_level_percent < 0 ||
      telemetry.fuel_level_percent > 100
    ) {
      errors.push("fuel_level_percent must be between 0 and 100");
    }

    if (!["ON", "OFF"].includes(telemetry.engine_state)) {
      errors.push("engine_state must be ON or OFF");
    }

    if (typeof telemetry.odometer_miles !== "number" || telemetry.odometer_miles < 0) {
      errors.push("odometer_miles must be a number >= 0");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = TelemetryGenerator;