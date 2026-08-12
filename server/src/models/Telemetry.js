const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema(
  {
    vehicle_id: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    speed_mph: {
      type: Number,
      required: true,
      min: 0
    },
    fuel_level_percent: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    engine_state: {
      type: String,
      required: true,
      enum: ["ON", "OFF"]
    },
    odometer_miles: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Important for fetching recent history of one vehicle.
telemetrySchema.index({ vehicle_id: 1, timestamp: -1 });

module.exports = mongoose.model("Telemetry", telemetrySchema);
