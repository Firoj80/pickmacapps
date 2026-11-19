#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Load .dev.vars if present to get default local password/URL
function getEnvDefaults() {
  const envFile = path.resolve('.dev.vars');
  const vars = {};
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) vars[match[1].trim()] = match[2].trim();
    }
  }
  return vars;
}

const fileVars = getEnvDefaults();
const BASE = process.env.MINILYTICS_URL || 'https://minilytics.firojstats.workers.dev';
const PASSWORD = process.env.ADMIN_PASSWORD || fileVars.ADMIN_PASSWORD;

if (!PASSWORD) {
  console.error(JSON.stringify({ error: 'ADMIN_PASSWORD not set. Set it in .dev.vars or env.' }));
  process.exit(1);
}

let cookie = '';

async function call(endpoint, opts = {}) {
  const res = await fetch(BASE + endpoint, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      cookie,
      ...(opts.headers ?? {}),
    },
  });
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function login() {
  const res = await call('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password: PASSWORD }),
  });
  if (res.status !== 200) {
    throw new Error(`Login failed (HTTP ${res.status}): ${JSON.stringify(res.body)}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'report'; // sites | overview | breakdown | realtime | customers | report
  const siteId = args[1];
  const period = args[2] || '7d'; // today | yesterday | 24h | 7d | 30d | 90d | 12m | all

  await login();

  if (action === 'sites') {
    const sites = await call('/api/sites');
    console.log(JSON.stringify(sites.body, null, 2));
    return;
  }

  // If no siteId provided, default to the first site found
  let targetSiteId = siteId;
  if (!targetSiteId) {
    const sitesRes = await call('/api/sites');
    if (Array.isArray(sitesRes.body) && sitesRes.body.length > 0) {
      targetSiteId = sitesRes.body[0].id;
    } else {
      console.log(JSON.stringify({ error: 'No sites found. Add a website in Minilytics first.' }, null, 2));
      return;
    }
  }

  if (action === 'realtime') {
    const res = await call(`/api/sites/${targetSiteId}/realtime`);
    console.log(JSON.stringify(res.body, null, 2));
    return;
  }

  if (action === 'overview') {
    const res = await call(`/api/sites/${targetSiteId}/overview?period=${period}`);
    console.log(JSON.stringify(res.body, null, 2));
    return;
  }

  if (action === 'customers') {
    const res = await call(`/api/sites/${targetSiteId}/customers?period=${period}`);
    console.log(JSON.stringify(res.body, null, 2));
    return;
  }

  if (action === 'breakdown') {
    const dim = args[3] || 'source'; // source | channel | country | device | browser | page | utm_campaign
    const res = await call(`/api/sites/${targetSiteId}/breakdown?period=${period}&dim=${dim}`);
    console.log(JSON.stringify(res.body, null, 2));
    return;
  }

  if (action === 'report') {
    // Generate full comprehensive report for AI agent analysis
    const [overviewRes, sourcesRes, channelsRes, pagesRes, countriesRes, devicesRes, campaignsRes, realtimeRes] =
      await Promise.all([
        call(`/api/sites/${targetSiteId}/overview?period=${period}`),
        call(`/api/sites/${targetSiteId}/breakdown?period=${period}&dim=source&limit=10`),
        call(`/api/sites/${targetSiteId}/breakdown?period=${period}&dim=channel&limit=10`),
        call(`/api/sites/${targetSiteId}/breakdown?period=${period}&dim=page&limit=10`),
        call(`/api/sites/${targetSiteId}/breakdown?period=${period}&dim=country&limit=10`),
        call(`/api/sites/${targetSiteId}/breakdown?period=${period}&dim=device&limit=5`),
        call(`/api/sites/${targetSiteId}/breakdown?period=${period}&dim=campaign&limit=10`),
        call(`/api/sites/${targetSiteId}/realtime`),
      ]);

    const report = {
      siteId: targetSiteId,
      period,
      overview: overviewRes.body,
      realtimeOnline: realtimeRes.body?.online ?? 0,
      recentEvents: realtimeRes.body?.events?.slice(0, 5) ?? [],
      trafficSources: sourcesRes.body,
      channels: channelsRes.body,
      topPages: pagesRes.body,
      countries: countriesRes.body,
      devices: devicesRes.body,
      campaigns: campaignsRes.body,
    };

    console.log(JSON.stringify(report, null, 2));
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
