require("dotenv").config();

const Simulator = require("./Simulator");

/**
 * Default vehicle configuration.
 * Each vehicle is assigned a scenario that will trigger specific rules.
 */
const DEFAULT_VEHICLES = [
  { vehicleId: "VIN-SIM-001", scenario: "NORMAL" },
  { vehicleId: "VIN-SIM-002", scenario: "SPEEDING" },
  { vehicleId: "VIN-SIM-003", scenario: "LOW_FUEL" },
  { vehicleId: "VIN-SIM-004", scenario: "ENGINE_OFF" }
];

/**
 * Create and configure the simulator.
 * @returns {Simulator}
 */
function createSimulator() {
  const config = {
    interval: parseInt(process.env.SIMULATION_INTERVAL) || 1000,
    logLevel: process.env.LOG_LEVEL || "info",
    transport: {
      backendUrl: process.env.BACKEND_URL || "http://localhost:5000",
      endpoint: process.env.TELEMETRY_ENDPOINT || "/api/v1/telemetry"
    }
  };

  const simulator = new Simulator(config);

  // Get vehicle count from env or use default
  const vehicleCount = parseInt(process.env.VEHICLE_COUNT) || DEFAULT_VEHICLES.length;

  // Add vehicles based on config
  for (let i = 0; i < Math.min(vehicleCount, DEFAULT_VEHICLES.length); i++) {
    const vehicleConfig = DEFAULT_VEHICLES[i];
    simulator.addVehicle(vehicleConfig.vehicleId, vehicleConfig.scenario);
  }

  // If more vehicles requested than defaults, add extra normal vehicles
  if (vehicleCount > DEFAULT_VEHICLES.length) {
    for (let i = DEFAULT_VEHICLES.length; i < vehicleCount; i++) {
      simulator.addVehicle(`VIN-SIM-${String(i + 1).padStart(3, "0")}`, "NORMAL");
    }
  }

  return simulator;
}

/**
 * Main entry point.
 */
async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Vehicle Telematics Simulator");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");

  // Create simulator
  const simulator = createSimulator();

  // Check connection to backend
  console.log(`Checking connection to backend...`);
  const connected = await simulator.isConnected();

  if (connected) {
    console.log("✓ Backend is reachable");
  } else {
    console.log("✗ Backend is not reachable. Simulator will continue and retry.");
    console.log("  Make sure the backend is running at: http://localhost:5000");
  }
  console.log("");

  // Display configuration
  console.log("Configuration:");
  console.log(`  Backend URL: ${process.env.BACKEND_URL || "http://localhost:5000"}`);
  console.log(`  Endpoint: ${process.env.TELEMETRY_ENDPOINT || "/api/v1/telemetry"}`);
  console.log(`  Interval: ${process.env.SIMULATION_INTERVAL || 1000}ms`);
  console.log(`  Vehicles: ${simulator.getVehicleCount()}`);
  console.log("");

  // Display vehicle scenarios
  console.log("Vehicles:");
  simulator.vehicles.forEach((v) => {
    console.log(`  ${v.vehicle.vehicleId} → ${v.scenarioName}`);
  });
  console.log("");

  console.log("Starting simulation... Press Ctrl+C to stop.");
  console.log("─────────────────────────────────────────────────────────────");

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n─────────────────────────────────────────────────────────────");
    console.log("Shutting down simulator...");
    simulator.stop();
    console.log("Simulator stopped.");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    simulator.stop();
    process.exit(0);
  });

  // Start the simulator
  simulator.start();
}

// Run if this is the main module
main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});

module.exports = { createSimulator, Simulator };