require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Rule = require("../src/models/Rule");

const demoRules = [
  {
    name: "High Speed Alert",
    description: "Triggers immediately when speed is above 80 mph.",
    type: "simple",
    field: "speed_mph",
    operator: "gt",
    threshold: 80,
    severity: "HIGH",
    cooldownMinutes: 5,
    targetVehicles: [],
    active: true
  },
  {
    name: "Low Fuel Alert",
    description: "Triggers immediately when fuel drops below 15%.",
    type: "simple",
    field: "fuel_level_percent",
    operator: "lt",
    threshold: 15,
    severity: "MEDIUM",
    cooldownMinutes: 10,
    targetVehicles: [],
    active: true
  },
  {
    name: "Sustained Overspeed",
    description: "Speed must remain above 70 mph for 3 recent pings.",
    type: "windowed",
    field: "speed_mph",
    operator: "gt",
    threshold: 70,
    severity: "CRITICAL",
    windowSeconds: 60,
    requiredConsecutive: 3,
    cooldownMinutes: 10,
    targetVehicles: [],
    active: true
  }
];

async function seed() {
  await connectDB();

  await Rule.deleteMany({});
  await Rule.insertMany(demoRules);

  console.log("Demo rules inserted");
  await mongoose.connection.close();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
