const Rule = require("../models/Rule");
const Alert = require("../models/Alert");
const Telemetry = require("../models/Telemetry");

function compare(actual, operator, expected) {
  switch (operator) {
    case "gt":
      return Number(actual) > Number(expected);
    case "gte":
      return Number(actual) >= Number(expected);
    case "lt":
      return Number(actual) < Number(expected);
    case "lte":
      return Number(actual) <= Number(expected);
    case "eq":
      return String(actual) === String(expected);
    case "neq":
      return String(actual) !== String(expected);
    default:
      return false;
  }
}

function operatorLabel(operator) {
  const labels = {
    gt: ">",
    gte: ">=",
    lt: "<",
    lte: "<=",
    eq: "==",
    neq: "!="
  };
  return labels[operator] || operator;
}

function ruleAppliesToVehicle(rule, vehicleId) {
  return (
    !rule.targetVehicles ||
    rule.targetVehicles.length === 0 ||
    rule.targetVehicles.includes(vehicleId)
  );
}

async function evaluateSimpleRule(rule, telemetry) {
  return compare(
    telemetry[rule.field],
    rule.operator,
    rule.threshold
  );
}

async function evaluateWindowedRule(rule, telemetry) {
  const endTime = new Date(telemetry.timestamp);
  const startTime = new Date(
    endTime.getTime() - rule.windowSeconds * 1000
  );

  const recentPings = await Telemetry.find({
    vehicle_id: telemetry.vehicle_id,
    timestamp: {
      $gte: startTime,
      $lte: endTime
    }
  })
    .sort({ timestamp: -1 })
    .limit(rule.requiredConsecutive)
    .lean();

  // We need enough data points before calling it a persistent condition.
  if (recentPings.length < rule.requiredConsecutive) {
    return false;
  }

  // "Persist over a sequence" = all latest N pings must match.
  return recentPings.every((ping) =>
    compare(ping[rule.field], rule.operator, rule.threshold)
  );
}

async function createOrUpdateAlert(rule, telemetry) {
  const cooldownStart = new Date(
    Date.now() - rule.cooldownMinutes * 60 * 1000
  );

  // If an alert for the same rule and vehicle is already active,
  // update it instead of creating many duplicate alerts.
  const activeAlert = await Alert.findOne({
    ruleId: rule._id,
    vehicleId: telemetry.vehicle_id,
    status: { $in: ["OPEN", "ACKNOWLEDGED"] }
  }).sort({ lastTriggeredAt: -1 });

  if (activeAlert) {
    activeAlert.lastTriggeredAt = new Date();
    activeAlert.triggerCount += 1;
    activeAlert.snapshot = telemetry;
    await activeAlert.save();

    return {
      created: false,
      reason: "existing-active-alert",
      alert: activeAlert
    };
  }

  // Even if the previous alert was resolved/suppressed, respect cooldown.
  const recentAlert = await Alert.findOne({
    ruleId: rule._id,
    vehicleId: telemetry.vehicle_id,
    lastTriggeredAt: { $gte: cooldownStart }
  }).sort({ lastTriggeredAt: -1 });

  if (recentAlert) {
    return {
      created: false,
      reason: "cooldown",
      alert: recentAlert
    };
  }

  const message =
    `${rule.name}: ${rule.field} ${operatorLabel(rule.operator)} ` +
    `${rule.threshold} for vehicle ${telemetry.vehicle_id}`;

  const alert = await Alert.create({
    ruleId: rule._id,
    ruleName: rule.name,
    vehicleId: telemetry.vehicle_id,
    message,
    severity: rule.severity,
    triggeredAt: new Date(),
    lastTriggeredAt: new Date(),
    snapshot: telemetry
  });

  // MVP notification.
  // In production this should be pushed to a queue/worker.
  console.log(
    `[NOTIFICATION] ${alert.severity} | ${alert.vehicleId} | ${alert.message}`
  );

  return {
    created: true,
    reason: "triggered",
    alert
  };
}

async function evaluateRulesForTelemetry(telemetryDocument) {
  const telemetry =
    telemetryDocument.toObject?.() || telemetryDocument;

  const allActiveRules = await Rule.find({ active: true });

  const matchingRules = allActiveRules.filter((rule) =>
    ruleAppliesToVehicle(rule, telemetry.vehicle_id)
  );

  const results = [];

  for (const rule of matchingRules) {
    let matched = false;

    if (rule.type === "simple") {
      matched = await evaluateSimpleRule(rule, telemetry);
    }

    if (rule.type === "windowed") {
      matched = await evaluateWindowedRule(rule, telemetry);
    }

    if (!matched) {
      results.push({
        ruleId: rule._id,
        ruleName: rule.name,
        matched: false
      });
      continue;
    }

    const alertResult = await createOrUpdateAlert(rule, telemetry);

    results.push({
      ruleId: rule._id,
      ruleName: rule.name,
      matched: true,
      alertCreated: alertResult.created,
      reason: alertResult.reason,
      alertId: alertResult.alert?._id
    });
  }

  return results;
}

module.exports = {
  evaluateRulesForTelemetry,
  compare
};
