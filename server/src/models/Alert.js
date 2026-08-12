const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rule",
      required: true,
      index: true
    },
    ruleName: {
      type: String,
      required: true
    },
    vehicleId: {
      type: String,
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM"
    },
    status: {
      type: String,
      enum: ["OPEN", "ACKNOWLEDGED", "RESOLVED", "SUPPRESSED"],
      default: "OPEN",
      index: true
    },
    triggeredAt: {
      type: Date,
      default: Date.now
    },
    lastTriggeredAt: {
      type: Date,
      default: Date.now
    },
    triggerCount: {
      type: Number,
      default: 1
    },
    acknowledgedAt: Date,
    acknowledgedBy: String,
    resolvedAt: Date,
    resolvedBy: String,
    suppressionReason: String,
    escalationLevel: {
      type: Number,
      default: 0
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

alertSchema.index({ ruleId: 1, vehicleId: 1, status: 1 });
alertSchema.index({ vehicleId: 1, triggeredAt: -1 });

module.exports = mongoose.model("Alert", alertSchema);
