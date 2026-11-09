import { execFileSync } from 'node:child_process';

const [sha] = process.argv.slice(2);
if (!/^[a-f0-9]{40}$/.test(sha ?? '')) {
  console.error('Usage: npm run collect:checks -- <full-40-character-sha>');
  process.exit(2);
}
// Fixed fixture repository, one page, bounded response and wall clock. Never reads logs or findings.
const response = JSON.parse(execFileSync('gh', [
  'api', `repos/CodeTelemetry/vercel-capabilities/commits/${sha}/check-runs?per_page=100`,
  '-H', 'Accept: application/vnd.github+json'
], { encoding: 'utf8', timeout: 15000, maxBuffer: 256 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }));
console.log(JSON.stringify({
  schemaVersion: 1,
  observedAt: new Date().toISOString(),
  repository: 'CodeTelemetry/vercel-capabilities',
  requestedSha: sha,
  complete: response.total_count <= 100,
  totalCount: response.total_count,
  checks: response.check_runs.map(check => ({
    id: check.id,
    app: { id: check.app?.id, slug: check.app?.slug },
    name: check.name,
    headSha: check.head_sha,
    matchesRequestedSha: check.head_sha === sha,
    status: check.status,
    conclusion: check.conclusion,
    startedAt: check.started_at,
    completedAt: check.completed_at,
    externalId: check.external_id,
    detailsUrl: check.details_url
  }))
}, null, 2));
