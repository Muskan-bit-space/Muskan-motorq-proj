const Scenario = require("./Scenario");

/**
 * Speeding scenario that increases speed above 80 mph.
 * Designed to trigger the "High Speed Alert" rule (speed > 80).
 */
class SpeedingScenario extends Scenario {
  constructor() {
    super("SPEEDING");
    this.tickCount = 0;
    this.phase = "accelerating"; // accelerating, cruising, decelerating
  }

  apply(vehicle, deltaSeconds) {
    this.tickCount++;

    // Start engine on first tick
    if (this.tickCount === 1) {
      vehicle.setEngineState("ON");
      vehicle.speed = 70;
    }

    // Phase 1: Accelerate toward 90+ mph (0-15 ticks)
    // Phase 2: Cruise at high speed (15-40 ticks)
    // Phase 3: Decelerate back to normal (40+ ticks)

    if (this.tickCount <= 15) {
      // Accelerating: increase speed by 1-2 mph per tick
      vehicle.updateSpeed(1.5);
      if (vehicle.speed > 85) {
        this.phase = "cruising";
      }
    } else if (this.tickCount <= 40) {
      // Cruising: maintain 85-95 mph
      const variation = Math.sin(this.tickCount * 0.3) * 3;
      vehicle.updateSpeed(variation);
      // Ensure we stay above 80 to trigger the rule
      if (vehicle.speed < 80) {
        vehicle.speed = 80;
      }
    } else {
      // Decelerating: gradually reduce speed
      vehicle.updateSpeed(-1);
    }

    // Fuel decreases at higher rate due to higher speed
    const fuelConsumption = 0.8 * deltaSeconds;
    vehicle.updateFuel(-fuelConsumption);

    // Update odometer
    vehicle.updateOdometer(deltaSeconds);
  }

  reset() {
    this.tickCount = 0;
    this.phase = "accelerating";
  }
}

module.exports = SpeedingScenario;