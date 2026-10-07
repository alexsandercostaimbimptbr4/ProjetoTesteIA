import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Makes E2E_EMAIL_DOMAIN from .env.local visible to the tests.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// Dedicated port and a fresh production build: the suite never attaches to
// whatever happens to be running on the dev port.
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: BASE_URL,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `${BASE_URL}/login`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
