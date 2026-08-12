const express = require("express");
const Alert = require("../models/Alert");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 300);
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.vehicleId) {
      filter.vehicleId = req.query.vehicleId;
    }

    const alerts = await Alert.find(filter)
      .sort({ lastTriggeredAt: -1 })
      .limit(limit)
      .lean();

    res.json(alerts);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/acknowledge", async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    if (alert.status === "RESOLVED") {
      return res.status(400).json({
        message: "Resolved alert cannot be acknowledged"
      });
    }

    alert.status = "ACKNOWLEDGED";
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = req.body.by || "Operator";
    await alert.save();

    res.json(alert);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/resolve", async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    alert.status = "RESOLVED";
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.body.by || "Operator";
    await alert.save();

    res.json(alert);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/suppress", async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    alert.status = "SUPPRESSED";
    alert.suppressionReason =
      req.body.reason || "Suppressed by operator";
    await alert.save();

    res.json(alert);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/escalate", async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    alert.escalationLevel += 1;

    const severityOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const currentIndex = severityOrder.indexOf(alert.severity);

    if (currentIndex < severityOrder.length - 1) {
      alert.severity = severityOrder[currentIndex + 1];
    }

    await alert.save();

    res.json(alert);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
