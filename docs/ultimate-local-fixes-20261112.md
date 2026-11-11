# Final local correctness and public-document repairs

Base: `63451ca`. This package is a local QA candidate, not a deployment or a
claim of complete production acceptance. OAuth and server authorization are
unchanged; all existing cache/logout/parallel-refresh regressions remain.

Six pre-fix actual-module tests failed and their raw evidence is retained:

- Locale, theme and test-banner providers threw when browser storage was
  unavailable. Public legal documents must not depend on persistent storage.
- A slower old-subject dictation response replaced and spoke the newer subject;
  old loaded questions also remained visible while the next subject loaded.
- Two Finish calls before the next React render issued two completion requests.

The repair handles optional preference storage failures, skips sessionStorage on
public privacy, keeps transient theme/language/dismissal usable, uses keyed
dictation data with AbortSignal and cancels obsolete speech. Practice uses
same-tick request guards, aborts on unmount, resets per session, ignores stale
results, preserves answers on failure and shows a generic actionable error
instead of logging raw server errors. Optional signal arguments preserve the
existing API wrappers and payload contracts. Server-side XP idempotency remains
required and unchanged; these client tests are not a server reward test.

The public privacy document now links to the existing canonical backend
`/account-deletion` resource. The intended backend origin is corroborated by
the Flutter production default. That resource is currently404 in production,
so this source repair does not mark the deployed deletion flow as passed.
Legacy OpenAI/data-sharing policy claims are not silently replaced with a
fictional live NVIDIA disclosure; a version-scoped draft/product review is
prepared separately in the audit artifacts.

Seven hook warnings are addressed by actual dependency/callback fixes, not rule
suppression: dictation, practice timer/finish, stable dashboard loading,
stable empty SAT question arrays, resend cooldown and explicit default locale.
The nine remaining `<img>` warnings are individually retained as image/LCP
review concerns; an unmeasured optimizer/cost/URL allowlist change was not added
just to silence warnings. Existing branding and layout are preserved.

An additional positive-flow regression confirmed that an expired timer retried
a failed completion on an unrelated parent rerender. Its auto-finish latch now
permits one automatic attempt per session; explicit retry remains available.

One additional regression reproduced raw backend validation fields entering
API error telemetry. Telemetry now records a generic HTTP status message;
local error status/detail and existing consumer behavior are preserved. This
does not claim that all unrelated analytics fields or deployment settings were
audited or redacted.

The final suite has32 tests: the20 previously accepted cases plus12 new public
storage, stale-response, duplicate-request, cancellation, retry and privacy-link
and telemetry cases. Tests run real TypeScript/React modules with synthetic browser/storage/
HTTP boundaries, not real user data. They do not establish browser hydration,
responsive rendering, hosted OAuth, real NVIDIA inference or Play upgrade.

All source changes require a separately approved exact QA push and its own
Linux CI result. Vercel's exact QA branch deployment restriction, production
configuration, dependencies, Flutter/backend code, databases and Play are not
changed by this package.
