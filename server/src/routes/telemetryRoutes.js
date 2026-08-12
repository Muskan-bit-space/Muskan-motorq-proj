const express = require("express");
const Telemetry = require("../models/Telemetry");
const { evaluateRulesForTelemetry } = require("../services/ruleEngine");

const router = express.Router();

function validateTelemetry(body) {
  const errors = [];

  if (!body.vehicle_id || typeof body.vehicle_id !== "string") {
    errors.push("vehicle_id is required");
  }

  const timestamp = body.timestamp
    ? new Date(body.timestamp)
    : new Date();

  if (Number.isNaN(timestamp.getTime())) {
    errors.push("timestamp must be a valid date");
  }

  if (
    body.speed_mph === undefined ||
    Number.isNaN(Number(body.speed_mph)) ||
    Number(body.speed_mph) < 0
  ) {
    errors.push("speed_mph must be a number >= 0");
  }

  if (
    body.fuel_level_percent === undefined ||
    Number.isNaN(Number(body.fuel_level_percent)) ||
    Number(body.fuel_level_percent) < 0 ||
    Number(body.fuel_level_percent) > 100
  ) {
    errors.push("fuel_level_percent must be between 0 and 100");
  }

  if (!["ON", "OFF"].includes(String(body.engine_state).toUpperCase())) {
    errors.push("engine_state must be ON or OFF");
  }

  if (
    body.odometer_miles === undefined ||
    Number.isNaN(Number(body.odometer_miles)) ||
    Number(body.odometer_miles) < 0
  ) {
    errors.push("odometer_miles must be a number >= 0");
  }

  return {
    errors,
    cleanData: {
      vehicle_id: body.vehicle_id?.trim(),
      timestamp,
      speed_mph: Number(body.speed_mph),
      fuel_level_percent: Number(body.fuel_level_percent),
      engine_state: String(body.engine_state).toUpperCase(),
      odometer_miles: Number(body.odometer_miles)
    }
  };
}

async function ingestTelemetry(payload) {
  const { errors, cleanData } = validateTelemetry(payload);

  if (errors.length > 0) {
    const error = new Error(errors.join(", "));
    error.statusCode = 400;
    throw error;
  }

  const telemetry = await Telemetry.create(cleanData);
  const ruleResults = await evaluateRulesForTelemetry(telemetry);

  return {
    telemetry,
    ruleResults
  };
}

// Generate one realistic-looking test ping.
router.post("/simulate", async (req, res, next) => {
  try {
    const vehicleId =
      req.body.vehicle_id ||
      `VIN-DEMO-${Math.floor(Math.random() * 3) + 1}`;

    const payload = {
      vehicle_id: vehicleId,
      timestamp: new Date(),
      speed_mph: Math.floor(Math.random() * 101),
      fuel_level_percent: Math.floor(Math.random() * 101),
      engine_state: Math.random() > 0.15 ? "ON" : "OFF",
      odometer_miles: 12000 + Math.floor(Math.random() * 1000)
    };

    const result = await ingestTelemetry(payload);

    res.status(201).json({
      message: "Sample telemetry generated and processed",
      ...result
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const result = await ingestTelemetry(req.body);

    res.status(201).json({
      message: "Telemetry stored and rules evaluated",
      ...result
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    const filter = {};
    if (req.query.vehicle_id) {
      filter.vehicle_id = req.query.vehicle_id;
    }

    const data = await Telemetry.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
