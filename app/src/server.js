const express = require("express");
const os = require("os");

const app = express();

const PORT = process.env.PORT || 8080;
const APP_NAME = process.env.APP_NAME || "CloudOps Demo App";
const APP_VERSION = process.env.APP_VERSION || "v1.0.0";
const ENVIRONMENT = process.env.ENVIRONMENT || "local";
const REGION = process.env.REGION || "unknown";
const INSTANCE_NAME = process.env.INSTANCE_NAME || os.hostname();

let requestCount = 0;
let isReady = true;

app.use(express.json());

app.use((req, res, next) => {
  requestCount += 1;
  next();
});

function getAppMetadata() {
  return {
    appName: APP_NAME,
    version: APP_VERSION,
    environment: ENVIRONMENT,
    region: REGION,
    hostname: os.hostname(),
    instanceName: INSTANCE_NAME,
    platform: os.platform(),
    uptimeSeconds: Math.floor(process.uptime()),
    requestCount,
    timestamp: new Date().toISOString()
  };
}

app.get("/", (req, res) => {
  const metadata = getAppMetadata();

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${APP_NAME}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f4f7fb;
            color: #1f2937;
            padding: 40px;
          }

          .card {
            background: white;
            max-width: 760px;
            margin: auto;
            padding: 32px;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          }

          h1 {
            color: #2563eb;
            margin-top: 0;
          }

          .version {
            display: inline-block;
            background: #dbeafe;
            color: #1d4ed8;
            padding: 6px 12px;
            border-radius: 999px;
            font-weight: bold;
          }

          .grid {
            display: grid;
            grid-template-columns: 220px 1fr;
            gap: 12px;
            margin-top: 24px;
          }

          .label {
            font-weight: bold;
            color: #374151;
          }

          .value {
            color: #111827;
            word-break: break-word;
          }

          .links {
            margin-top: 32px;
          }

          .links a {
            display: inline-block;
            margin: 6px 8px 6px 0;
            padding: 10px 14px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-size: 14px;
          }

          .warning {
            background: #fef3c7;
            padding: 12px;
            border-radius: 8px;
            margin-top: 24px;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${metadata.appName}</h1>
          <div class="version">${metadata.version}</div>

          <div class="grid">
            <div class="label">Environment</div>
            <div class="value">${metadata.environment}</div>

            <div class="label">Region</div>
            <div class="value">${metadata.region}</div>

            <div class="label">Hostname</div>
            <div class="value">${metadata.hostname}</div>

            <div class="label">Instance Name</div>
            <div class="value">${metadata.instanceName}</div>

            <div class="label">Platform</div>
            <div class="value">${metadata.platform}</div>

            <div class="label">Uptime</div>
            <div class="value">${metadata.uptimeSeconds} seconds</div>

            <div class="label">Requests Served</div>
            <div class="value">${metadata.requestCount}</div>

            <div class="label">Timestamp</div>
            <div class="value">${metadata.timestamp}</div>
          </div>

          <div class="links">
            <a href="/health">Health</a>
            <a href="/ready">Readiness</a>
            <a href="/version">Version</a>
            <a href="/metadata">Metadata</a>
            <a href="/stress?duration=10">CPU Stress</a>
            <a href="/slow?delay=3000">Slow Response</a>
          </div>

          <div class="warning">
            The <strong>/crash</strong> endpoint intentionally terminates the process.
            Use it only when demonstrating container or Kubernetes self-healing.
          </div>
        </div>
      </body>
    </html>
  `);
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    message: "Application is running",
    ...getAppMetadata()
  });
});

app.get("/ready", (req, res) => {
  if (!isReady) {
    return res.status(503).json({
      status: "not ready",
      message: "Application is currently marked as not ready",
      ...getAppMetadata()
    });
  }

  res.status(200).json({
    status: "ready",
    message: "Application is ready to receive traffic",
    ...getAppMetadata()
  });
});

app.get("/version", (req, res) => {
  res.status(200).json({
    appName: APP_NAME,
    version: APP_VERSION,
    environment: ENVIRONMENT,
    timestamp: new Date().toISOString()
  });
});

app.get("/metadata", (req, res) => {
  res.status(200).json(getAppMetadata());
});

app.get("/stress", (req, res) => {
  const duration = Number(req.query.duration || 10);
  const safeDuration = Math.min(Math.max(duration, 1), 60);

  const endTime = Date.now() + safeDuration * 1000;

  while (Date.now() < endTime) {
    Math.sqrt(Math.random() * Number.MAX_SAFE_INTEGER);
  }

  res.status(200).json({
    status: "completed",
    message: `CPU stress test completed for ${safeDuration} seconds`,
    durationSeconds: safeDuration,
    ...getAppMetadata()
  });
});

app.get("/slow", async (req, res) => {
  const delay = Number(req.query.delay || 3000);
  const safeDelay = Math.min(Math.max(delay, 100), 30000);

  await new Promise((resolve) => setTimeout(resolve, safeDelay));

  res.status(200).json({
    status: "completed",
    message: `Slow response completed after ${safeDelay} ms`,
    delayMs: safeDelay,
    ...getAppMetadata()
  });
});

app.post("/readiness/fail", (req, res) => {
  isReady = false;

  res.status(200).json({
    status: "updated",
    message: "Application readiness has been set to false",
    ready: isReady,
    ...getAppMetadata()
  });
});

app.post("/readiness/recover", (req, res) => {
  isReady = true;

  res.status(200).json({
    status: "updated",
    message: "Application readiness has been restored",
    ready: isReady,
    ...getAppMetadata()
  });
});

app.get("/crash", (req, res) => {
  res.status(500).json({
    status: "crashing",
    message: "Application will terminate in 1 second",
    ...getAppMetadata()
  });

  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

app.use((req, res) => {
  res.status(404).json({
    status: "not found",
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
    availableRoutes: [
      "GET /",
      "GET /health",
      "GET /ready",
      "GET /version",
      "GET /metadata",
      "GET /stress?duration=10",
      "GET /slow?delay=3000",
      "GET /crash",
      "POST /readiness/fail",
      "POST /readiness/recover"
    ]
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`${APP_NAME} ${APP_VERSION} running on port ${PORT}`);
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log(`Region: ${REGION}`);
  console.log(`Hostname: ${os.hostname()}`);
});
