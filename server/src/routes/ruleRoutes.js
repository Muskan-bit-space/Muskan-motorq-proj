const express = require("express");
const Rule = require("../models/Rule");

const router = express.Router();

function normalizeThreshold(value) {
  if (typeof value === "number") return value;

  const asNumber = Number(value);
  if (value !== "" && !Number.isNaN(asNumber)) {
    return asNumber;
  }

  return String(value).toUpperCase();
}

function cleanRuleBody(body) {
  const targetVehicles = Array.isArray(body.targetVehicles)
    ? body.targetVehicles
    : String(body.targetVehicles || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    name: body.name,
    description: body.description || "",
    type: body.type,
    field: body.field,
    operator: body.operator,
    threshold: normalizeThreshold(body.threshold),
    targetVehicles,
    windowSeconds: Number(body.windowSeconds) || 60,
    requiredConsecutive: Number(body.requiredConsecutive) || 3,
    cooldownMinutes:
      body.cooldownMinutes === 0
        ? 0
        : Number(body.cooldownMinutes) || 5,
    severity: body.severity || "MEDIUM",
    active: body.active !== false
  };
}

router.get("/", async (req, res, next) => {
  try {
    const rules = await Rule.find().sort({ createdAt: -1 }).lean();
    res.json(rules);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = cleanRuleBody(req.body);

    if (!body.name || !body.type || !body.field || !body.operator) {
      return res.status(400).json({
        message: "name, type, field and operator are required"
      });
    }

    if (body.threshold === undefined || body.threshold === "") {
      return res.status(400).json({
        message: "threshold is required"
      });
    }

    if (
      body.field === "engine_state" &&
      !["eq", "neq"].includes(body.operator)
    ) {
      return res.status(400).json({
        message: "engine_state supports only eq or neq operators"
      });
    }

    const rule = await Rule.create(body);
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const updated = await Rule.findByIdAndUpdate(
      req.params.id,
      cleanRuleBody(req.body),
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {
      return res.status(404).json({ message: "Rule not found" });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/toggle", async (req, res, next) => {
  try {
    const rule = await Rule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }

    rule.active = !rule.active;
    await rule.save();

    res.json(rule);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Rule.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Rule not found" });
    }

    res.json({ message: "Rule deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
