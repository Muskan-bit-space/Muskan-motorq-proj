# FleetPulse

I built the MVP with MERN. Every telemetry ping is stored first. I then fetch only active rules applicable to that vehicle. Simple rules are evaluated on the current payload. Windowed rules query only the required recent time window instead of loading the vehicle's entire history. When a rule matches, I create an alert and use a cooldown to avoid alert spam. Alerts have a basic lifecycle: open, acknowledged, resolved and suppressed.

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

For this project, I intentionally did something slightly better while keeping the code simple:

1. Store the incoming ping.
2. Load only rules relevant to the vehicle.
3. For simple rules, evaluate only the current ping.
4. For windowed rules, query only the small time window required by the rule.
5. Create/update an alert in MongoDB.
6. Simulate notification delivery with a console log instead of blocking the telemetry request on SMTP.

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

