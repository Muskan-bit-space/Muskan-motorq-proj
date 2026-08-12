const Scenario = require("./Scenario");

/**
 * Normal driving scenario with stable speed and gradual fuel consumption.
 * Speed oscillates around 60-70 mph, fuel decreases slowly.
 */
class NormalScenario extends Scenario {
  constructor() {
    super("NORMAL");
    this.tickCount = 0;
  }

  apply(vehicle, deltaSeconds) {
    this.tickCount++;

    // Start engine on first tick
    if (this.tickCount === 1) {
      vehicle.setEngineState("ON");
      vehicle.speed = 60;
    }

    // Speed oscillates between 58-72 mph (normal highway driving)
    const baseSpeed = 65;
    const variation = Math.sin(this.tickCount * 0.5) * 7;
    vehicle.updateSpeed(variation);

    // Fuel decreases slowly (~0.5% per second when moving)
    const fuelConsumption = 0.5 * deltaSeconds;
    vehicle.updateFuel(-fuelConsumption);

    // Update odometer
    vehicle.updateOdometer(deltaSeconds);
  }

  reset() {
    this.tickCount = 0;
  }
}

module.exports = NormalScenario;