# Telematics Alert Rule Engine — MERN MVP

A fresher-friendly MVP for the interview/project brief shown in the provided document.

## What this MVP covers

- Receive vehicle telemetry through `POST /api/v1/telemetry`
- Store telemetry history in MongoDB
- Create configurable **simple rules**
- Create configurable **windowed rules**
- Target all vehicles or selected vehicle IDs
- Avoid duplicate alerts using a notification cooldown
- View alerts
- Acknowledge, resolve, suppress and escalate alerts
- Generate sample telemetry from the UI
- Simple React dashboard for demo

## MERN Stack

- **MongoDB** — telemetry, rules and alerts
- **Express.js** — REST API
- **React** — dashboard
- **Node.js** — backend runtime
- **Mongoose** — MongoDB models

## Important design decision

The reference document suggests loading a vehicle's complete history into memory for every ping and synchronously sending email.

For this MVP we intentionally do something slightly better while keeping the code simple:

1. Store the incoming ping.
2. Load only rules relevant to the vehicle.
3. For simple rules, evaluate only the current ping.
4. For windowed rules, query only the small time window required by the rule.
5. Create/update an alert in MongoDB.
6. Simulate notification delivery with a console log instead of blocking the telemetry request on SMTP.

This is still easy to explain as a fresher and shows that you understood the trade-off.

---

# Project Structure

```text
telematics-alert-rule-engine-mvp/
├── README.md
├── server/
│   ├── .env.example
│   ├── package.json
│   ├── scripts/
│   │   └── seed.js
│   └── src/
│       ├── index.js
│       ├── config/
│       │   └── db.js
│       ├── models/
│       │   ├── Alert.js
│       │   ├── Rule.js
│       │   └── Telemetry.js
│       ├── routes/
│       │   ├── alertRoutes.js
│       │   ├── ruleRoutes.js
│       │   └── telemetryRoutes.js
│       └── services/
│           └── ruleEngine.js
└── client/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── api.js
        ├── main.jsx
        └── styles.css
```

# 1. Prerequisites

Use Node.js **20.19+** because the included Vite 8 setup requires it.

You also need either:

- MongoDB running locally, or
- a MongoDB Atlas connection string.

# 2. Start the Backend

```bash
cd server
npm install
```

Copy `.env.example` to `.env`.

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/telematics_rule_engine
CLIENT_ORIGIN=http://localhost:5173
```

Then:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/api/health
```

# 3. Seed Example Rules

In another terminal:

```bash
cd server
npm run seed
```

This inserts:

- Speed above 80 mph
- Fuel below 15%
- Sustained speed above 70 mph for 3 consecutive pings

# 4. Start the Frontend

```bash
cd client
npm install
```

Copy `.env.example` to `.env`.

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Then:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

# API Examples

## Send Telemetry

```http
POST /api/v1/telemetry
Content-Type: application/json
```

```json
{
  "vehicle_id": "VIN1234567890",
  "timestamp": "2026-08-03T10:45:00Z",
  "speed_mph": 85,
  "fuel_level_percent": 42,
  "engine_state": "ON",
  "odometer_miles": 12050
}
```

## Create a Simple Rule

```http
POST /api/v1/rules
```

```json
{
  "name": "High Speed Alert",
  "description": "Alert when speed is above 80 mph",
  "type": "simple",
  "field": "speed_mph",
  "operator": "gt",
  "threshold": 80,
  "targetVehicles": [],
  "severity": "HIGH",
  "cooldownMinutes": 5,
  "active": true
}
```

An empty `targetVehicles` array means the rule applies to every vehicle.

## Create a Windowed Rule

```json
{
  "name": "Sustained Overspeed",
  "description": "Speed must remain over 70 mph for 3 recent pings",
  "type": "windowed",
  "field": "speed_mph",
  "operator": "gt",
  "threshold": 70,
  "targetVehicles": [],
  "severity": "CRITICAL",
  "windowSeconds": 60,
  "requiredConsecutive": 3,
  "cooldownMinutes": 10,
  "active": true
}
```

## Alert Lifecycle

```text
PATCH /api/v1/alerts/:id/acknowledge
PATCH /api/v1/alerts/:id/resolve
PATCH /api/v1/alerts/:id/suppress
PATCH /api/v1/alerts/:id/escalate
```

# How Windowed Rules Work

Example:

```text
speed_mph > 70
windowSeconds = 60
requiredConsecutive = 3
```

After a new telemetry ping:

1. The system looks at the latest telemetry for that vehicle from the last 60 seconds.
2. It takes the latest 3 pings.
3. All 3 must satisfy `speed_mph > 70`.
4. If yes, the alert is triggered.

This makes the temporal rule implementation easy to understand and demonstrate.

# MongoDB Collections

## telemetry

Stores every vehicle ping.

Important indexes:

- `{ vehicle_id: 1, timestamp: -1 }`

## rules

Stores configurable alert rules.

Important fields:

- `type`
- `field`
- `operator`
- `threshold`
- `targetVehicles`
- `windowSeconds`
- `requiredConsecutive`
- `cooldownMinutes`
- `active`

## alerts

Stores the alert lifecycle.

Important fields:

- `ruleId`
- `vehicleId`
- `status`
- `severity`
- `triggeredAt`
- `acknowledgedAt`
- `resolvedAt`
- `escalationLevel`

# What to Say in the Interview

A simple explanation:

> "I built the MVP with MERN. Every telemetry ping is stored first. I then fetch only active rules applicable to that vehicle. Simple rules are evaluated on the current payload. Windowed rules query only the required recent time window instead of loading the vehicle's entire history. When a rule matches, I create an alert and use a cooldown to avoid alert spam. Alerts have a basic lifecycle: open, acknowledged, resolved and suppressed."

For production scale, mention that you would later add:

- Kafka / RabbitMQ for asynchronous ingestion
- Redis for hot window state and cooldowns
- Worker services for rule evaluation
- A real notification queue for email/SMS
- Authentication and RBAC
- Schema validation with Joi/Zod
- Rate limiting
- Observability and retry/dead-letter queues
- Partitioning / retention strategy for very large telemetry data

Do **not** over-engineer these into the submitted MVP unless the interviewer specifically asks for them.
# muski-don
