import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const envFile = path.join(rootDir, ".env.local");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envFile);

const baseUrl = process.env.LOCAL_SCHEDULER_URL || "http://localhost:3000";
const intervalMs = Number(process.env.LOCAL_SCHEDULER_INTERVAL_MS || 5_000);
const cronSecret = process.env.CRON_SECRET;

async function runOnce() {
  const headers = cronSecret
    ? {
        Authorization: `Bearer ${cronSecret}`,
      }
    : undefined;

  const response = await fetch(`${baseUrl}/api/automation/generate`, {
    method: "GET",
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed with ${response.status}`);
  }

  const characterName = payload?.character?.name || "unknown-character";
  const sceneName = payload?.scene?.name || "unknown-scene";

  console.log(
    `[${new Date().toISOString()}] Generated character="${characterName}" scene="${sceneName}"`
  );
}

console.log(`Local scheduler started. Target: ${baseUrl}/api/automation/generate`);
console.log(`Interval: ${Math.round(intervalMs / 1000)} seconds`);

await runOnce().catch((error) => {
  console.error(`[startup] ${error.message}`);
});

setInterval(async () => {
  try {
    await runOnce();
  } catch (error) {
    console.error(`[tick] ${error.message}`);
  }
}, intervalMs);
