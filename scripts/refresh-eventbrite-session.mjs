#!/usr/bin/env node
// Pastes a fresh Eventbrite session Cookie header into the app's Supabase-backed
// session store, so lib/eventbrite/api.ts::ebFetchSession() picks it up immediately
// (no Vercel env var, no redeploy).
//
// Usage:
//   node scripts/refresh-eventbrite-session.mjs
//   (paste the Cookie header when prompted, press Enter)
//
// Config: reads BASE_URL and SECRET from .env.eventbrite-refresh in the repo root
// (git-ignored — see .gitignore's `.env*` rule), or prompts for anything missing.
//   BASE_URL=https://dark-promoters.vercel.app
//   SECRET=<the EVENTBRITE_SESSION_WRITE_SECRET value from Vercel>

import { readFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, '..', '.env.eventbrite-refresh');

function loadConfig() {
  if (!existsSync(configPath)) return {};
  const lines = readFileSync(configPath, 'utf8').split('\n');
  const config = {};
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (match) config[match[1]] = match[2];
  }
  return config;
}

async function prompt(rl, question) {
  const answer = await rl.question(question);
  return answer.trim();
}

async function main() {
  const config = loadConfig();
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const baseUrl = config.BASE_URL || await prompt(rl, 'App base URL (e.g. https://dark-promoters.vercel.app): ');
  const secret = config.SECRET || await prompt(rl, 'EVENTBRITE_SESSION_WRITE_SECRET: ');
  const cookie = await prompt(rl, 'Paste the Cookie header value from DevTools: ');

  rl.close();

  if (!cookie) {
    console.error('No cookie provided — aborting.');
    process.exit(1);
  }

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/admin/eventbrite-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ cookie, refreshed_by: process.env.USERNAME || process.env.USER || null }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`Failed (${res.status}):`, data.error ?? data);
    process.exit(1);
  }

  console.log(`Session refreshed at ${data.refreshed_at}`);
}

main();
