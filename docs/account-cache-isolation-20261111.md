# Account-owned web study state

This follow-up is local to the frontend QA branch. It does not change the OAuth
provider, add guest access, alter server permissions or deploy any service.

Two synthetic defects were reproduced against the previous code:

1. Account A's IELTS band was read as B's after logout/login because the local
   key identified the paper but not its owner. Answers, writing drafts,
   annotations, vocabulary progress, college bookmarks and the SAT session
   handoff used the same unowned pattern.
2. A delayed refresh could restore A's session after logout, replacing the
   newly selected B session. A delayed successful API response could also be
   returned after the account changed.

Personal study storage now uses `ilm-study:<user-id>:<encoded-resource>`.
Invalid/signed-out owners cannot persist it. Reading/listening controlled mode
continues to use the parent's answers; the shared answer hook masks the previous
owner immediately and rejects stale setters. A late score callback must carry
its captured owner. The existing auth provider remounts account-owned screen
state when the identity changes and observes other-tab session changes.
Refresh writes and returned API results must still belong to the initiating
session; unchanged-account refresh and normal auth errors retain their behavior.

An additional parallel-request review found that comparing returned results
against exact token bytes rejected valid same-account responses after rotation.
Results now check account ownership, while credential writes retain the strict
snapshot check. Parallel expired requests share one in-flight refresh, and a
sibling's already-rotated token is reused. Two further regressions cover these
normal same-owner flows alongside all previous logout/cross-account cases.

These client keys prevent accidental mixing, not unauthorized access to a
server. Existing server-side token verification and owner checks remain required.
The client does not authenticate anyone from a display name, email or cache key.

Unknown legacy unscoped keys are retained on disk but never automatically
assigned to the next account. Their owner cannot be established safely from
those keys. Consequently an old unscoped local-only draft/band is not displayed
as another user's progress. No server progress or existing user record is
deleted or migrated by this patch. Theme, language, timer preferences and tour
dismissal remain device preferences. No private browser data was used in tests.

Regression coverage executes actual TypeScript/React modules against synthetic
storage, controlled delayed transports and test accounts. It includes A/B/A,
logout during refresh, stale private responses, parent-controlled answers,
draft remount, corrupt/quota storage, WritingExam feedback, AuthProvider state
reset and other-tab logout. The only added package is a dev-only React18.3.1
test renderer matching the existing React runtime. The CI adds an explicit
advisory check; it still only tests/builds and the exact QA branch remains
excluded from Vercel automatic deployment.

Local passing tests are not a hosted browser or Google OAuth E2E acceptance.
The prior `4008664` Linux CI does not cover this follow-up. A separate exact
commit push approval and subsequent Linux CI are required. Production remains
NO-GO until the independent release gates also pass.
