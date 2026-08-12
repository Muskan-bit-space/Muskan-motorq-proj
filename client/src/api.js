const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  getRules() {
    return request("/rules");
  },

  createRule(rule) {
    return request("/rules", {
      method: "POST",
      body: JSON.stringify(rule)
    });
  },

  toggleRule(id) {
    return request(`/rules/${id}/toggle`, {
      method: "PATCH"
    });
  },

  deleteRule(id) {
    return request(`/rules/${id}`, {
      method: "DELETE"
    });
  },

  getAlerts() {
    return request("/alerts?limit=100");
  },

  updateAlert(id, action, body = {}) {
    return request(`/alerts/${id}/${action}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  },

  getTelemetry() {
    return request("/telemetry?limit=30");
  },

  sendTelemetry(payload) {
    return request("/telemetry", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  simulateTelemetry(vehicle_id) {
    return request("/telemetry/simulate", {
      method: "POST",
      body: JSON.stringify({ vehicle_id })
    });
  }
};
