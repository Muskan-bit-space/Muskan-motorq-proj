const mongoose = require("mongoose");

const ruleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    type: {
      type: String,
      required: true,
      enum: ["simple", "windowed"]
    },
    field: {
      type: String,
      required: true,
      enum: [
        "speed_mph",
        "fuel_level_percent",
        "engine_state",
        "odometer_miles"
      ]
    },
    operator: {
      type: String,
      required: true,
      enum: ["gt", "gte", "lt", "lte", "eq", "neq"]
    },
    threshold: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    // Empty array means "all vehicles".
    targetVehicles: {
      type: [String],
      default: []
    },

    // Used only for windowed rules.
    windowSeconds: {
      type: Number,
      default: 60,
      min: 1
    },
    requiredConsecutive: {
      type: Number,
      default: 3,
      min: 2
    },

    // Prevent repeated alert spam.
    cooldownMinutes: {
      type: Number,
      default: 5,
      min: 0
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM"
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

ruleSchema.index({ active: 1 });
ruleSchema.index({ targetVehicles: 1 });

module.exports = mongoose.model("Rule", ruleSchema);
