# Vercel acceptance runbook

## Boundaries and prerequisites

Use only this isolated repository and an explicitly selected Vercel team.
Never import private application source or modify production gate policy.
Use the existing team plan; an upgrade or paid subscription is a separate owner decision.
Keep credentials and raw security output outside this repository.
Missing permission, unsupported plan, incomplete response, and absent findings
are blocked or unknown outcomes, never acceptance passes.

Sources checked on 2026-11-09:

- [Vercel CI CLI](https://vercel.com/docs/cli/ci)
- [CI configuration](https://vercel.com/docs/ci/configuration)
- [Standalone private-repository announcement](https://vercel.com/changelog/vercel-ci-no-longer-requires-a-linked-vercel-project)
- [Security Review](https://vercel.com/docs/agent/security-review)
- [Security CLI](https://vercel.com/docs/cli/security)

## CI

1. Run `npm ci` and `npm run ci` locally. Verify all five assertions pass.
2. Authenticate Vercel CLI 65.14.0, select the intended team, and verify GitHub App
   access to this fixture repository. Start without a linked Vercel project to
   test the documented standalone private-repository mode.
3. In this clone, run `vercel ci enable --scope <team> --remote origin --json`.
   Record actual eligibility errors; do not infer eligibility from the docs.
4. Push a branch changing the fixture calculation or test input, then inspect
   bounded JSON: `vercel ci ls --scope <team> --branch <branch> --commit <sha>
   --limit 20 --json`, followed by `vercel ci inspect <run> --scope <team> --json`.
5. Run `npm run collect:checks -- <full-sha>` to compare GitHub App ID, check
   name, exact SHA, outcome, and external ID with the Vercel invocation. A
   deployment or green aggregate does not prove that the test task executed.
6. Change expected sum to 7 on a fixture branch. Confirm a failed task and check
   at that exact SHA. Restore 6 in a later commit and confirm the earlier proof
   remains stale for the new head. Do not merge the intentional failure.
7. Push a docs-only commit after a successful run. Inspect whether the task is
   cached, skipped, absent, or executed; report the actual result separately.
   The untagged `manual-only` task must not be claimed as test execution.
8. Record pending/cancelled/denied outcomes only when observed. Cross-tenant,
   repository-ID and duplicate-event safety need separate authorized samples;
   local synthetic cases are not live coverage.

## Security Review

1. Verify the selected team's plan and Security Review access. Hobby is not an
   eligible plan. Stop before a plan upgrade or payment.
2. If already available, restrict review enablement to this fixture project.
   Never enable all production projects as part of an acceptance test.
3. For a pushed benign fixture revision, correlate the real GitHub review
   check's App ID, name, and SHA. Keep source review distinct from exploit proof.
4. Use `vercel security vulnerabilities list --scope <team> --limit 20 --json`.
   Retain only reviewed field names/types and counts. Full `inspect` output can
   contain source and sensitive descriptions; do not commit it.
5. If no finding exists, record finding-level contract verification as untested.
   Dismissed/closed findings and unmerged fixes never prove deployed remediation.

## Evidence

Record the tested source SHA, fixture SHA, tool versions, commands, dates,
pass/fail/blocked result for each criterion, and remaining access or plan blockers.
Pre-merge acceptance is separate from final acceptance on the merged revision.
