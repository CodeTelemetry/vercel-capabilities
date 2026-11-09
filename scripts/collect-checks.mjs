import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const [sha] = args;
if (args.length !== 1 || !/^[a-f0-9]{40}$/.test(sha ?? '')) {
  console.error('Usage: npm run collect:checks -- <full-40-character-sha>');
  process.exit(2);
}

function id(value) {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('Invalid ID');
  return value;
}

function text(value, limit, nullable = false) {
  if (nullable && value === null) return null;
  if (typeof value !== 'string' || value.length > limit || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error('Invalid text');
  }
  return value;
}

try {
  // One page, a fixed repository/host, bounded response and wall clock.
  // GitHub may include annotation bodies in its response; never echo raw output on failure.
  const response = JSON.parse(execFileSync('gh', [
    'api', '--hostname', 'github.com',
    `repos/CodeTelemetry/vercel-capabilities/commits/${sha}/check-runs?filter=all&per_page=100&page=1`,
    '-H', 'Accept: application/vnd.github+json',
    '-H', 'X-GitHub-Api-Version: 2022-11-28'
  ], { encoding: 'utf8', timeout: 15000, maxBuffer: 256 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }));
  if (!Number.isSafeInteger(response?.total_count) || response.total_count < 0 ||
      !Array.isArray(response.check_runs) || response.check_runs.length > 100 ||
      response.check_runs.length > response.total_count) throw new Error('Invalid page');
  const ids = new Set();
  const checks = response.check_runs.map(check => {
    const checkId = id(check.id);
    if (ids.has(checkId)) throw new Error('Duplicate check');
    ids.add(checkId);
    const headSha = text(check.head_sha, 40);
    if (!/^[a-f0-9]{40}$/.test(headSha)) throw new Error('Invalid SHA');
    return {
      id: checkId,
      app: check.app === null ? null : { id: id(check.app.id), slug: text(check.app.slug, 100) },
      name: text(check.name, 256),
      headSha,
      matchesRequestedSha: headSha === sha,
      status: text(check.status, 32),
      conclusion: text(check.conclusion, 32, true),
      startedAt: text(check.started_at, 40, true),
      completedAt: text(check.completed_at, 40, true)
    };
  });
  console.log(JSON.stringify({
    schemaVersion: 2,
    observedAt: new Date().toISOString(),
    repository: 'CodeTelemetry/vercel-capabilities',
    requestedSha: sha,
    coverage: {
      filter: 'all',
      page: 1,
      perPage: 100,
      returnedCount: checks.length,
      reportedTotal: response.total_count,
      pageComplete: response.total_count === checks.length,
      historyComplete: null
    },
    checks
  }, null, 2));
} catch {
  // Error objects can embed raw stdout/stderr, URLs, annotations, or credentials.
  console.error(JSON.stringify({ schemaVersion: 2, status: 'unknown', reason: 'collection_failed' }));
  process.exitCode = 1;
}
