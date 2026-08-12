const Scenario = require("./Scenario");

/**
 * Engine off scenario where vehicle comes to a stop.
 * Speed drops to 0 and engine state changes to OFF.
 */
class EngineOffScenario extends Scenario {
  constructor() {
    super("ENGINE_OFF");
    this.tickCount = 0;
    this.engineOffTick = null;
  }

  apply(vehicle, deltaSeconds) {
    this.tickCount++;

    if (this.tickCount === 1) {
      // Start with engine on and moderate speed
      vehicle.setEngineState("ON");
      vehicle.speed = 65;
      vehicle.fuelLevel = 75;
    }

    if (this.tickCount === 5) {
      // Turn off engine after a few seconds of driving
      vehicle.setEngineState("OFF");
      this.engineOffTick = this.tickCount;
    }

    if (this.engineOffTick !== null) {
      // After engine off, speed should already be 0 (set by setEngineState)
      // Keep speed at 0
      vehicle.speed = 0;

      // Minimal fuel consumption when engine is off
      const fuelConsumption = 0.05 * deltaSeconds;
      vehicle.updateFuel(-fuelConsumption);
    }

    // Update odometer (only while moving)
    vehicle.updateOdometer(deltaSeconds);
  }

  isComplete() {
    return this.engineOffTick !== null && this.tickCount > this.engineOffTick + 3;
  }

  reset() {
    this.tickCount = 0;
    this.engineOffTick = null;
  }
}

module.exports = EngineOffScenario;