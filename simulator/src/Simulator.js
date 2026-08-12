const Vehicle = require("./models/Vehicle");
const TelemetryGenerator = require("./telemetry/TelemetryGenerator");
const { HttpTransport } = require("./transport");
const { getScenarioByName, listScenarios } = require("./scenarios");

/**
 * Simulator manages multiple vehicles running different scenarios.
 * Coordinates the simulation loop: update state → generate telemetry → send.
 */
class Simulator {
  /**
   * @param {Object} config - Simulator configuration
   * @param {number} config.interval - Simulation interval in ms
   * @param {Object} config.transport - Transport configuration
   * @param {Function} config.onTick - Callback after each tick (optional)
   */
  constructor(config = {}) {
    this.interval = config.interval || parseInt(process.env.SIMULATION_INTERVAL) || 1000;
    this.onTick = config.onTick || null;
    this.running = false;
    this.intervalId = null;
    this.lastTickTime = Date.now();

    // Initialize transport
    const transportConfig = config.transport || {};
    this.transport = new HttpTransport(transportConfig);

    // Vehicle registry
    this.vehicles = [];

    // Logging
    this.logLevel = config.logLevel || process.env.LOG_LEVEL || "info";
  }

  /**
   * Add a vehicle with a specific scenario.
   * @param {string} vehicleId - Unique vehicle identifier
   * @param {string} scenarioName - Name of scenario to run
   * @param {Object} initialState - Optional initial vehicle state
   * @returns {Vehicle} The created vehicle
   */
  addVehicle(vehicleId, scenarioName, initialState = {}) {
    const ScenarioClass = getScenarioByName(scenarioName);
    const scenario = new ScenarioClass();
    const vehicle = new Vehicle(vehicleId, initialState);

    this.vehicles.push({
      vehicle,
      scenario,
      scenarioName
    });

    this._log("debug", `[${vehicleId}] Added with scenario: ${scenarioName}`);
    return vehicle;
  }

  /**
   * Start the simulation loop.
   */
  start() {
    if (this.running) {
      this._log("warn", "Simulator already running");
      return;
    }

    this._log("info", `Starting simulator with ${this.vehicles.length} vehicle(s), interval: ${this.interval}ms`);
    this.running = true;
    this.lastTickTime = Date.now();

    // Start the loop
    this._tick();

    this.intervalId = setInterval(() => {
      this._tick();
    }, this.interval);
  }

  /**
   * Stop the simulation loop.
   */
  stop() {
    if (!this.running) {
      return;
    }

    this._log("info", "Stopping simulator");
    this.running = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Execute one simulation tick.
   */
  async _tick() {
    const now = Date.now();
    const deltaSeconds = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    const promises = this.vehicles.map(async (v) => {
      return this._processVehicle(v.vehicle, v.scenario, v.scenarioName, deltaSeconds);
    });

    // Wait for all vehicles to process
    await Promise.all(promises);

    // Callback if provided
    if (this.onTick) {
      this.onTick();
    }
  }

  /**
   * Process a single vehicle: update state → generate telemetry → send.
   * @param {Vehicle} vehicle
   * @param {Scenario} scenario
   * @param {string} scenarioName
   * @param {number} deltaSeconds
   */
  async _processVehicle(vehicle, scenario, scenarioName, deltaSeconds) {
    try {
      // 1. Apply scenario to update vehicle state
      scenario.apply(vehicle, deltaSeconds);

      // 2. Generate telemetry payload
      const telemetry = TelemetryGenerator.generate(vehicle);

      // 3. Send telemetry via transport
      const result = await this.transport.send(telemetry);

      // 4. Log the result
      const state = vehicle.getState();
      if (result.success) {
        this._log("info",
          `[${state.vehicleId}] ${scenarioName} | speed=${state.speed} | fuel=${state.fuelLevel}% | engine=${state.engineState} | sent=OK`
        );
      } else {
        this._log("error",
          `[${state.vehicleId}] ${scenarioName} | telemetry send FAILED | reason=${result.error}`
        );
      }

      // 5. Check if scenario is complete (for one-time scenarios)
      if (scenario.isComplete && scenario.isComplete()) {
        this._log("info", `[${vehicle.vehicleId}] Scenario ${scenarioName} complete, resetting`);
        scenario.reset();
        // Optionally reset vehicle state too
        vehicle.reset();
      }

    } catch (error) {
      this._log("error", `[${vehicle.vehicleId}] Unexpected error: ${error.message}`);
    }
  }

  /**
   * Internal logging helper.
   * @param {string} level - Log level
   * @param {string} message - Log message
   */
  _log(level, message) {
    const levels = ["debug", "info", "warn", "error"];
    const currentLevel = levels.indexOf(this.logLevel);
    const messageLevel = levels.indexOf(level);

    if (messageLevel >= currentLevel) {
      const timestamp = new Date().toISOString();
      console.log(`${timestamp} ${level.toUpperCase().padEnd(5)} ${message}`);
    }
  }

  /**
   * Check if simulator is connected to backend.
   * @returns {Promise<boolean>}
   */
  async isConnected() {
    return this.transport.isConnected();
  }

  /**
   * Get list of scenarios.
   * @returns {string[]}
   */
  getAvailableScenarios() {
    return listScenarios();
  }

  /**
   * Get number of vehicles.
   * @returns {number}
   */
  getVehicleCount() {
    return this.vehicles.length;
  }
}

module.exports = Simulator;