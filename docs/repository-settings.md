# CI and repository protection

GitHub Actions runs `tests` and `secret-scan` on pushes to `main`, pull requests
and manual dispatch. The workflow uses Node 24, npm 11.19.1, pinned first-party
Actions, hosted runners, read-only repository access and bounded job deadlines.
No Vercel credential, deployment, paid scan, or live check collection is needed.
Turbo execution is forced, so the fixture's CI result is not a replayed cache hit.

The secret scan pins Gitleaks 8.30.1 and verifies the release archive's SHA-256.
It scans the fetched Git history with upstream default rules, full redaction,
and no repository-provided ignore file or inline suppression. A private scan
finding should be handled locally; avoid posting secret values in issues or logs.

The repository-level Actions policy allows only the two exact action revisions
used by this workflow and requires full-SHA pins. Update the workflow and
allowlist together when upgrading an Action.

## Apply settings

Run from this repository's root with an authorized GitHub administrator session:

```sh
gh api --method PUT repos/CodeTelemetry/vercel-capabilities/actions/permissions \
  --input .github/actions-permissions.json
gh api --method PUT repos/CodeTelemetry/vercel-capabilities/actions/permissions/selected-actions \
  --input .github/allowed-actions.json
gh api --method PUT repos/CodeTelemetry/vercel-capabilities/actions/permissions/workflow \
  --input .github/workflow-permissions.json
gh api --method PUT repos/CodeTelemetry/vercel-capabilities/branches/main/protection \
  --input .github/branch-protection.json
```

The branch policy requires a pull request, the `tests` and `secret-scan` checks
from the GitHub Actions App, an up-to-date branch, linear history and resolved
review conversations. It applies to administrators and disallows force pushes
and branch deletion. There is no mandatory independent reviewer because the
repository currently has one maintainer; the required checks still apply.

Branch protection for a private organization repository requires an eligible
GitHub plan. If the API returns HTTP 403 for this reason, the JSON policy is
prepared but enforcement is not active. After publication or a GitHub plan
change, reapply it and verify the server's actual state. A committed policy file
does not enforce anything by itself.

```sh
gh api repos/CodeTelemetry/vercel-capabilities/actions/permissions
gh api repos/CodeTelemetry/vercel-capabilities/actions/permissions/selected-actions
gh api repos/CodeTelemetry/vercel-capabilities/actions/permissions/workflow
gh api repos/CodeTelemetry/vercel-capabilities/branches/main/protection
```

GitHub CI validates the reusable fixture independently of Vercel. The live Vercel
acceptance status remains documented in the [dated run record](runs/2026-11-09.md).
