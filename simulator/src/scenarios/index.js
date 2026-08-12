const Scenario = require("./Scenario");
const NormalScenario = require("./NormalScenario");
const SpeedingScenario = require("./SpeedingScenario");
const LowFuelScenario = require("./LowFuelScenario");
const EngineOffScenario = require("./EngineOffScenario");

/**
 * Registry of available scenarios.
 */
const SCENARIOS = {
  NORMAL: NormalScenario,
  SPEEDING: SpeedingScenario,
  LOW_FUEL: LowFuelScenario,
  ENGINE_OFF: EngineOffScenario
};

/**
 * Get scenario class by name
 * @param {string} name - Scenario name
 * @returns {Class} Scenario class
 */
function getScenarioByName(name) {
  const ScenarioClass = SCENARIOS[name.toUpperCase()];
  if (!ScenarioClass) {
    throw new Error(`Unknown scenario: ${name}. Available: ${Object.keys(SCENARIOS).join(", ")}`);
  }
  return ScenarioClass;
}

/**
 * List available scenario names
 * @returns {string[]}
 */
function listScenarios() {
  return Object.keys(SCENARIOS);
}

module.exports = {
  Scenario,
  NormalScenario,
  SpeedingScenario,
  LowFuelScenario,
  EngineOffScenario,
  SCENARIOS,
  getScenarioByName,
  listScenarios
};