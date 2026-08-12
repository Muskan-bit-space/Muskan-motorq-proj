const Scenario = require("./Scenario");

/**
 * Low fuel scenario that decreases fuel level below 15%.
 * Designed to trigger the "Low Fuel Alert" rule (fuel < 15%).
 */
class LowFuelScenario extends Scenario {
  constructor() {
    super("LOW_FUEL");
    this.tickCount = 0;
    this.lowFuelReached = false;
  }

  apply(vehicle, deltaSeconds) {
    this.tickCount++;

    // Start engine on first tick with moderate speed
    if (this.tickCount === 1) {
      vehicle.setEngineState("ON");
      vehicle.speed = 55;
      vehicle.fuelLevel = 20; // Start with low fuel
    }

    // Speed stays moderate (not accelerating much to save fuel)
    const variation = Math.sin(this.tickCount * 0.4) * 5;
    vehicle.updateSpeed(variation);

    // Aggressive fuel consumption to reach < 15%
    // ~1.2% per second - will reach 15% in about 4-5 ticks
    const fuelConsumption = 1.2 * deltaSeconds;
    vehicle.updateFuel(-fuelConsumption);

    if (vehicle.fuelLevel <= 15) {
      this.lowFuelReached = true;
    }

    // When fuel gets very low, engine starts struggling
    if (vehicle.fuelLevel < 5) {
      vehicle.speed = Math.max(30, vehicle.speed - 2);
    }

    // Update odometer
    vehicle.updateOdometer(deltaSeconds);
  }

  isComplete() {
    return this.lowFuelReached;
  }

  reset() {
    this.tickCount = 0;
    this.lowFuelReached = false;
  }
}

module.exports = LowFuelScenario;