import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const emptyRule = {
  name: "",
  description: "",
  type: "simple",
  field: "speed_mph",
  operator: "gt",
  threshold: "80",
  targetVehicles: "",
  windowSeconds: 60,
  requiredConsecutive: 3,
  cooldownMinutes: 5,
  severity: "HIGH",
  active: true
};

const emptyTelemetry = {
  vehicle_id: "VIN1234567890",
  speed_mph: 65,
  fuel_level_percent: 42,
  engine_state: "ON",
  odometer_miles: 12050
};

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function App() {
  const [rules, setRules] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [telemetryForm, setTelemetryForm] = useState(emptyTelemetry);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activeRules = useMemo(
    () => rules.filter((rule) => rule.active).length,
    [rules]
  );

  const openAlerts = useMemo(
    () =>
      alerts.filter((alert) =>
        ["OPEN", "ACKNOWLEDGED"].includes(alert.status)
      ).length,
    [alerts]
  );

  async function loadData() {
    try {
      const [rulesData, alertsData, telemetryData] =
        await Promise.all([
          api.getRules(),
          api.getAlerts(),
          api.getTelemetry()
        ]);

      setRules(rulesData);
      setAlerts(alertsData);
      setTelemetry(telemetryData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function showSuccess(text) {
    setError("");
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  }

  function showError(err) {
    setMessage("");
    setError(err.message || String(err));
  }

  async function handleCreateRule(event) {
    event.preventDefault();
    setLoading(true);

    try {
      await api.createRule({
        ...ruleForm,
        targetVehicles: ruleForm.targetVehicles
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      });

      setRuleForm(emptyRule);
      showSuccess("Rule created successfully");
      await loadData();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendTelemetry(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await api.sendTelemetry({
        ...telemetryForm,
        timestamp: new Date().toISOString()
      });

      const matched = result.ruleResults.filter(
        (item) => item.matched
      ).length;

      showSuccess(
        `Telemetry processed. ${matched} rule(s) matched.`
      );
      await loadData();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulate() {
    setLoading(true);

    try {
      const result = await api.simulateTelemetry(
        telemetryForm.vehicle_id
      );

      const matched = result.ruleResults.filter(
        (item) => item.matched
      ).length;

      showSuccess(
        `Random telemetry generated. ${matched} rule(s) matched.`
      );
      await loadData();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAlertAction(id, action) {
    try {
      const body =
        action === "suppress"
          ? { reason: "Suppressed during demo" }
          : { by: "Demo Operator" };

      await api.updateAlert(id, action, body);
      showSuccess(`Alert ${action} action completed`);
      await loadData();
    } catch (err) {
      showError(err);
    }
  }

  async function handleRuleToggle(id) {
    try {
      await api.toggleRule(id);
      await loadData();
    } catch (err) {
      showError(err);
    }
  }

  async function handleRuleDelete(id) {
    const ok = window.confirm("Delete this rule?");
    if (!ok) return;

    try {
      await api.deleteRule(id);
      showSuccess("Rule deleted");
      await loadData();
    } catch (err) {
      showError(err);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MERN MVP</p>
          <h1>Telematics Alert Rule Engine</h1>
          <p className="subtitle">
            Ingest vehicle telemetry, evaluate rules and manage
            alerts.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={loadData}
          disabled={loading}
        >
          Refresh
        </button>
      </header>

      {message && <div className="toast success">{message}</div>}
      {error && <div className="toast error">{error}</div>}

      <section className="stats-grid">
        <StatCard label="Configured Rules" value={rules.length} />
        <StatCard label="Active Rules" value={activeRules} />
        <StatCard label="Open Alerts" value={openAlerts} />
        <StatCard
          label="Recent Pings Loaded"
          value={telemetry.length}
        />
      </section>

      <main className="main-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>1. Send Telemetry</h2>
              <p>
                Use the form or generate a random test ping.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendTelemetry} className="form-grid">
            <Field label="Vehicle ID">
              <input
                value={telemetryForm.vehicle_id}
                onChange={(e) =>
                  setTelemetryForm({
                    ...telemetryForm,
                    vehicle_id: e.target.value
                  })
                }
                required
              />
            </Field>

            <Field label="Speed (mph)">
              <input
                type="number"
                min="0"
                value={telemetryForm.speed_mph}
                onChange={(e) =>
                  setTelemetryForm({
                    ...telemetryForm,
                    speed_mph: Number(e.target.value)
                  })
                }
                required
              />
            </Field>

            <Field label="Fuel (%)">
              <input
                type="number"
                min="0"
                max="100"
                value={telemetryForm.fuel_level_percent}
                onChange={(e) =>
                  setTelemetryForm({
                    ...telemetryForm,
                    fuel_level_percent: Number(e.target.value)
                  })
                }
                required
              />
            </Field>

            <Field label="Engine">
              <select
                value={telemetryForm.engine_state}
                onChange={(e) =>
                  setTelemetryForm({
                    ...telemetryForm,
                    engine_state: e.target.value
                  })
                }
              >
                <option value="ON">ON</option>
                <option value="OFF">OFF</option>
              </select>
            </Field>

            <Field label="Odometer (miles)">
              <input
                type="number"
                min="0"
                value={telemetryForm.odometer_miles}
                onChange={(e) =>
                  setTelemetryForm({
                    ...telemetryForm,
                    odometer_miles: Number(e.target.value)
                  })
                }
                required
              />
            </Field>

            <div className="button-row full-width">
              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                Send Telemetry
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={handleSimulate}
                disabled={loading}
              >
                Generate Random Ping
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>2. Create Rule</h2>
              <p>
                Supports point-in-time and persistent conditions.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateRule} className="form-grid">
            <Field label="Rule name" full>
              <input
                value={ruleForm.name}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    name: e.target.value
                  })
                }
                placeholder="High Speed Alert"
                required
              />
            </Field>

            <Field label="Type">
              <select
                value={ruleForm.type}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    type: e.target.value
                  })
                }
              >
                <option value="simple">Simple</option>
                <option value="windowed">Windowed</option>
              </select>
            </Field>

            <Field label="Field">
              <select
                value={ruleForm.field}
                onChange={(e) => {
                  const field = e.target.value;
                  setRuleForm({
                    ...ruleForm,
                    field,
                    operator:
                      field === "engine_state"
                        ? "eq"
                        : ruleForm.operator
                  });
                }}
              >
                <option value="speed_mph">speed_mph</option>
                <option value="fuel_level_percent">
                  fuel_level_percent
                </option>
                <option value="engine_state">
                  engine_state
                </option>
                <option value="odometer_miles">
                  odometer_miles
                </option>
              </select>
            </Field>

            <Field label="Operator">
              <select
                value={ruleForm.operator}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    operator: e.target.value
                  })
                }
              >
                {ruleForm.field !== "engine_state" && (
                  <>
                    <option value="gt">&gt;</option>
                    <option value="gte">&gt;=</option>
                    <option value="lt">&lt;</option>
                    <option value="lte">&lt;=</option>
                  </>
                )}
                <option value="eq">==</option>
                <option value="neq">!=</option>
              </select>
            </Field>

            <Field label="Threshold">
              <input
                value={ruleForm.threshold}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    threshold: e.target.value
                  })
                }
                placeholder={
                  ruleForm.field === "engine_state"
                    ? "ON"
                    : "80"
                }
                required
              />
            </Field>

            <Field label="Severity">
              <select
                value={ruleForm.severity}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    severity: e.target.value
                  })
                }
              >
                <option>LOW</option>
                <option>MEDIUM</option>
                <option>HIGH</option>
                <option>CRITICAL</option>
              </select>
            </Field>

            <Field label="Cooldown (minutes)">
              <input
                type="number"
                min="0"
                value={ruleForm.cooldownMinutes}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    cooldownMinutes: Number(e.target.value)
                  })
                }
              />
            </Field>

            {ruleForm.type === "windowed" && (
              <>
                <Field label="Window (seconds)">
                  <input
                    type="number"
                    min="1"
                    value={ruleForm.windowSeconds}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        windowSeconds: Number(e.target.value)
                      })
                    }
                  />
                </Field>

                <Field label="Consecutive pings">
                  <input
                    type="number"
                    min="2"
                    value={ruleForm.requiredConsecutive}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        requiredConsecutive: Number(
                          e.target.value
                        )
                      })
                    }
                  />
                </Field>
              </>
            )}

            <Field label="Target vehicles" full>
              <input
                value={ruleForm.targetVehicles}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    targetVehicles: e.target.value
                  })
                }
                placeholder="Leave blank for all, or VIN1,VIN2"
              />
            </Field>

            <Field label="Description" full>
              <textarea
                rows="2"
                value={ruleForm.description}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    description: e.target.value
                  })
                }
                placeholder="Optional description"
              />
            </Field>

            <div className="full-width">
              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                Create Rule
              </button>
            </div>
          </form>
        </section>
      </main>

      <section className="panel section-spacing">
        <div className="panel-heading">
          <div>
            <h2>Configured Rules</h2>
            <p>
              Toggle rules on/off or remove demo rules.
            </p>
          </div>
        </div>

        <div className="card-list">
          {rules.length === 0 && (
            <Empty text="No rules yet. Create one above or run the seed script." />
          )}

          {rules.map((rule) => (
            <article className="rule-card" key={rule._id}>
              <div className="card-topline">
                <div>
                  <div className="badge-row">
                    <span
                      className={`badge ${
                        rule.active ? "active" : "inactive"
                      }`}
                    >
                      {rule.active ? "ACTIVE" : "DISABLED"}
                    </span>
                    <span className="badge neutral">
                      {rule.type.toUpperCase()}
                    </span>
                    <span
                      className={`badge severity ${rule.severity.toLowerCase()}`}
                    >
                      {rule.severity}
                    </span>
                  </div>
                  <h3>{rule.name}</h3>
                </div>

                <div className="small-actions">
                  <button
                    className="small-button"
                    onClick={() => handleRuleToggle(rule._id)}
                  >
                    {rule.active ? "Disable" : "Enable"}
                  </button>
                  <button
                    className="small-button danger"
                    onClick={() => handleRuleDelete(rule._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="rule-expression">
                {rule.field} {rule.operator}{" "}
                {String(rule.threshold)}
              </p>

              {rule.type === "windowed" && (
                <p className="muted">
                  Last {rule.requiredConsecutive} pings within{" "}
                  {rule.windowSeconds}s must all match.
                </p>
              )}

              <p className="muted">
                Target:{" "}
                {rule.targetVehicles?.length
                  ? rule.targetVehicles.join(", ")
                  : "All vehicles"}{" "}
                · Cooldown: {rule.cooldownMinutes} min
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel section-spacing">
        <div className="panel-heading">
          <div>
            <h2>3. Alert Management</h2>
            <p>
              View, acknowledge, resolve, suppress and escalate.
            </p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Severity</th>
                <th>Vehicle</th>
                <th>Rule</th>
                <th>Triggers</th>
                <th>Last Triggered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <Empty text="No alerts yet. Send telemetry that matches a rule." />
                  </td>
                </tr>
              )}

              {alerts.map((alert) => (
                <tr key={alert._id}>
                  <td>
                    <span
                      className={`status-pill ${alert.status.toLowerCase()}`}
                    >
                      {alert.status}
                    </span>
                  </td>
                  <td>{alert.severity}</td>
                  <td>{alert.vehicleId}</td>
                  <td>{alert.ruleName}</td>
                  <td>{alert.triggerCount}</td>
                  <td>{formatDate(alert.lastTriggeredAt)}</td>
                  <td>
                    <div className="table-actions">
                      {alert.status === "OPEN" && (
                        <button
                          onClick={() =>
                            handleAlertAction(
                              alert._id,
                              "acknowledge"
                            )
                          }
                        >
                          Ack
                        </button>
                      )}

                      {!["RESOLVED", "SUPPRESSED"].includes(
                        alert.status
                      ) && (
                        <>
                          <button
                            onClick={() =>
                              handleAlertAction(
                                alert._id,
                                "resolve"
                              )
                            }
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() =>
                              handleAlertAction(
                                alert._id,
                                "suppress"
                              )
                            }
                          >
                            Suppress
                          </button>
                          <button
                            onClick={() =>
                              handleAlertAction(
                                alert._id,
                                "escalate"
                              )
                            }
                          >
                            Escalate
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel section-spacing">
        <div className="panel-heading">
          <div>
            <h2>Recent Telemetry</h2>
            <p>Latest stored vehicle pings.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Speed</th>
                <th>Fuel</th>
                <th>Engine</th>
                <th>Odometer</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.map((ping) => (
                <tr key={ping._id}>
                  <td>{ping.vehicle_id}</td>
                  <td>{ping.speed_mph} mph</td>
                  <td>{ping.fuel_level_percent}%</td>
                  <td>{ping.engine_state}</td>
                  <td>{ping.odometer_miles}</td>
                  <td>{formatDate(ping.timestamp)}</td>
                </tr>
              ))}

              {telemetry.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <Empty text="No telemetry stored yet." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer>
        Fresher-friendly MVP · MongoDB + Express + React + Node
      </footer>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function Field({ label, children, full = false }) {
  return (
    <label className={full ? "field full-width" : "field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Empty({ text }) {
  return <div className="empty-state">{text}</div>;
}

export default App;
