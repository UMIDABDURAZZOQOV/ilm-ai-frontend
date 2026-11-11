# Frontend release security candidate — 2026-11-11

Local validation passed; not deployed or accepted as production-ready.

The original production dependency audit contained seven vulnerable-package
entries, including critical Next.js/DOMPurify advisories. Updating14.2.3 only to
14.2.35 did not address later2026 Next advisories, so this candidate uses the
patched15.5.29 line, matching eslint-config-next, and existing compatible library
updates. React18 is retained; Mermaid remains on11.17.2 rather than introducing
the Node22-only Mermaid12 requirement. Targeted transitive overrides patch
PostCSS8.5.32, KaTeX0.18.2 and the build parser's minimatch11.0.1.

Both production-only and final all-dependency npm audits returned zero advisory
entries for the reviewed lockfile. This is an advisory scan, not proof of zero
exploitable vulnerabilities. Initial and intermediate audit failures were retained
in the external audit artifacts; no `--force` update or lifecycle script was used.

Explicit ESLint core-web-vitals configuration prevents an interactive setup prompt
in CI. Twenty-two errors were fixed without disabling rules:21literal JSX text
characters in eight files were AST-checked and escaped to equal rendered text;
the privacy home link now uses NextLink. Existing20warnings (hooks/images) remain
visible and must not be called a zero-warning audit. Hook behavior was unchanged.

Local checks: two existing privacy-banner regressions, `next typegen` plus
TypeScript, standard lint (zero errors,20warnings), and full Next production build
all passed. Build API target was an intentionally non-operational test origin;
no production account/API write or deployment occurred. Public privacy hydration
and real browser accessibility remain unaccepted. Existing privacy copy was not
replaced with an unverified claim that NVIDIA is already active.

The CI change adds this exact QA branch and registers the existing banner tests
and fresh type generation before the retained lint/build steps. `vercel.json`
disables Git-triggered deployment for this exact QA branch only; other branches,
including main, keep Vercel's documented defaults. This permits a separately
approved QA push for tests without an automatic preview/production deployment.
No push or deployment is authorized by this document.

First local build failed with diskENOSPC. That failed log was retained. Only
SHA-matched generated APK/AAB duplicates and generated Flutter intermediates were
removed to recover disk space; verified archived APK/AAB/source/evidence remain.
The subsequent complete validation passed and immutable earlier receipts were
archived. No learner data or production resource was removed.

Primary references:

- [Next security update](https://nextjs.org/blog/security-update-2025-12-11)
- [DOMPurify advisory](https://github.com/cure53/DOMPurify/security/advisories/GHSA-cg2g-xh64-v4q7)
- [Vercel branch deployment controls](https://vercel.com/docs/project-configuration/git-configuration)

The overall ILM AI1.0.3 decision remainsNO-GO for the separate backend delivery,
live NVIDIA, mixed-age policy/Console, actual Play-signed upgrade and operational
acceptance gates. Passing this web candidate does not close those gates.
