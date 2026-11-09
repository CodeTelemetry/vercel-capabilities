import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, chmodSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('./collect-checks.mjs', import.meta.url));
const sha = 'a'.repeat(40);
const sentinel = 'SYNTHETIC_PRIVATE_PROVIDER_CONTENT';
const check = {
  id: 1, app: { id: 2, slug: 'fixture-app' }, name: 'fixture test', head_sha: sha,
  status: 'completed', conclusion: 'success', started_at: null, completed_at: null
};

// Exercise the actual executable boundary without network calls or real credentials.
function collect(payload, { exitCode = 0, raw = false, args = [sha] } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'vercel-checks-test-'));
  const executable = join(directory, 'gh');
  const argumentFile = join(directory, 'args.json');
  const body = raw ? payload : JSON.stringify(payload);
  writeFileSync(executable, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(argumentFile)}, JSON.stringify(process.argv.slice(2)));
process.stdout.write(${JSON.stringify(body)});
process.stderr.write(${JSON.stringify(exitCode ? sentinel : '')});
process.exitCode = ${exitCode};
`);
  chmodSync(executable, 0o700);
  try {
    const result = spawnSync(process.execPath, [script, ...args], {
      encoding: 'utf8', timeout: 20000, maxBuffer: 1024 * 1024,
      env: { PATH: `${directory}${delimiter}${process.env.PATH}` }
    });
    assert.ifError(result.error);
    return { ...result, ghArgs: existsSync(argumentFile) ? JSON.parse(readFileSync(argumentFile)) : null };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('opaque provider fields, annotations and extra properties are omitted', () => {
  const result = collect({ total_count: 1, check_runs: [{ ...check,
    external_id: sentinel, details_url: `https://example.com?token=${sentinel}`,
    output: { text: sentinel }, app: { ...check.app, description: sentinel }
  }] });
  assert.equal(result.status, 0);
  assert.equal(result.stdout.includes(sentinel), false);
  const output = JSON.parse(result.stdout);
  assert.equal(output.schemaVersion, 2);
  assert.equal(output.checks[0].matchesRequestedSha, true);
  assert.equal(output.coverage.pageComplete, true);
  assert.equal(output.coverage.historyComplete, null);
  assert(result.ghArgs.includes('github.com'));
  assert(result.ghArgs.some(arg => arg.includes('filter=all&per_page=100&page=1')));
});

test('a missing page is incomplete even if its reported total is below the page limit', () => {
  const result = collect({ total_count: 2, check_runs: [] });
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).coverage.pageComplete, false);
});

test('larger result sets stay bounded and incomplete', () => {
  const result = collect({ total_count: 101, check_runs: [check] });
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).coverage.pageComplete, false);
});

test('an empty page does not establish complete historical coverage', () => {
  const result = collect({ total_count: 0, check_runs: [] });
  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.coverage.pageComplete, true);
  assert.equal(output.coverage.historyComplete, null);
  assert.deepEqual(output.checks, []);
});

test('a different SHA remains explicitly mismatched', () => {
  const result = collect({ total_count: 1, check_runs: [{ ...check, head_sha: 'b'.repeat(40) }] });
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).checks[0].matchesRequestedSha, false);
});

test('duplicate records, inconsistent counts and malformed metadata fail without echoing input', () => {
  for (const payload of [
    { total_count: 2, check_runs: [check, check] },
    { total_count: 0, check_runs: [check] },
    { total_count: -1, check_runs: [] },
    { total_count: 1, check_runs: [{ ...check, name: { private: sentinel } }] },
    { total_count: 1, check_runs: [{ ...check, name: `bad\n${sentinel}` }] }
  ]) {
    const result = collect(payload);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr.includes(sentinel), false);
    assert.equal(JSON.parse(result.stderr).status, 'unknown');
  }
});

test('command failures, malformed JSON and response-size failures never echo provider content', () => {
  for (const [payload, options] of [
    [{ check_runs: [{ output: { text: sentinel } }] }, { exitCode: 1 }],
    [`${sentinel}{`, { raw: true }],
    [sentinel.repeat(12000), { raw: true }]
  ]) {
    const result = collect(payload, options);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr.includes(sentinel), false);
    assert.deepEqual(JSON.parse(result.stderr), {
      schemaVersion: 2, status: 'unknown', reason: 'collection_failed'
    });
  }
});

test('invalid references and extra arguments are rejected before invoking GitHub', () => {
  for (const args of [['main'], ['a'.repeat(39)], [sha, 'extra'], []]) {
    const result = collect({}, { args });
    assert.equal(result.status, 2);
    assert.equal(result.ghArgs, null);
  }
});
