# Vercel capabilities

An isolated CodeTelemetry repository for reproducible Vercel capability tests.
The repository starts private and is intended for eventual public release.
All source was written independently for this fixture. It contains no private
CodeTelemetry service implementation, customer data, or production credentials.
Every package is private and cannot be published to npm.

## Run locally

Use Node 24 and the pinned package manager from `package.json`.

```sh
npm ci
npm test
npm run ci
```

The Turborepo `test` task has the `ci` tag. `manual-only` deliberately has no CI
tag; its absence must never be reported as an executed or passing test.
The five Node tests check a small bounded calculation, including invalid inputs
and overflow. Changing `packages/ci-fixture/expectation.json` from `6` to `7`
creates a deterministic failing revision; change it back to restore passing tests.

## Live acceptance

See [the acceptance runbook](docs/acceptance.md). A passing local test is not
proof that Vercel CI ran. An AI Security Review is not proof of remediation.
Keep raw CLI responses, credentials, and security finding details outside Git.
Only reviewed metadata and sanitized aggregate results belong in `docs/runs/`.

Vercel CLI 65.14.0 and Turborepo 2.11.10 were selected on 2026-11-09.
The CLI is an external operator tool; it is not bundled into the fixture.

## Publication

Before changing GitHub visibility, inspect the complete history for credentials,
private data, and finding details. Standalone Vercel CI currently supports private
GitHub repositories; publishing this repository may require a different CI setup.
No open-source license has been selected yet.
