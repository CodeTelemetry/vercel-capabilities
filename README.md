# Vercel capabilities

An isolated public CodeTelemetry repository for reproducible Vercel capability tests.
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

The check collector reads only this fixture repository on github.com. Run
`node scripts/collect-checks.mjs <full-sha>` for machine-readable JSON. Its
version 2 output omits provider links, external IDs, annotations and raw errors.
It reports one page of up to 100 check runs, with `filter=all`. `pageComplete`
describes that bounded result, while `historyComplete: null` leaves historical
coverage unknown. GitHub retention and check-suite limits still apply.
Generated output can contain provider-controlled check names and identifiers;
keep it in ignored `artifacts/` and review it before sharing.

Vercel CLI 65.14.0 and Turborepo 2.11.10 were selected on 2026-11-09.
The CLI is an external operator tool; it is not bundled into the fixture.

## License

This project uses the [MIT License](LICENSE). If your company profits from this
code, please [let CodeTelemetry know](COMMERCIAL-USE.md). Notification is a
voluntary request and adds no conditions to the license.

## CI

GitHub Actions runs the fixture and adversarial tests plus a full-history secret
scan on pushes to `main` and pull requests. See [repository settings](docs/repository-settings.md)
for the pinned Actions policy and enforced branch-protection configuration.

GitHub Actions provides the required CI checks. Vercel CI does not currently
support public repositories: the authenticated enablement attempt returned
HTTP 409 on 2026-11-10. See the [live configuration result](docs/runs/2026-11-10.md).
The Turborepo tasks remain configured for Vercel CI when public-repository support
becomes available.
