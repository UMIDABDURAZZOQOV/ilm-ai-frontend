# Requirements Document

## Introduction

Ilm AI Mobile is a React Native (Expo + TypeScript) mobile application for the Ilm AI personal learning companion platform. The existing FastAPI backend handles all AI logic, authentication, file processing, and data storage. The mobile app is a pure UI client that communicates with the backend exclusively via REST API using JWT-based authentication.

The app targets learners in Uzbekistan and Central Asia, with full support for Uzbek, Russian, and English. It covers the complete MVP feature set: authentication, personal knowledge base, AI chat, quiz mode, knowledge gap detection, learning plan generation, Telegram bot integration, and payment/subscription management.

---

## Glossary

- **App**: The Ilm AI React Native mobile application.
- **User**: An authenticated person using the App.
- **Backend**: The existing FastAPI server that handles all AI, storage, and business logic.
- **JWT**: JSON Web Token issued by the Backend for authenticating API requests.
- **Access_Token**: A short-lived JWT used to authorize API requests.
- **Refresh_Token**: A long-lived JWT used to obtain a new Access_Token without re-login.
- **Knowledge_Base**: The collection of uploaded materials belonging to a User.
- **Topic**: A user-defined named collection grouping one or more materials within the Knowledge_Base.
- **Material**: A single uploaded document (PDF, Word, plain text) or pasted text entry stored in a Topic.
- **Chat_Session**: A single conversation thread between a User and the AI Learning Companion, grounded in uploaded materials.
- **Quiz_Session**: A single timed practice session where the AI generates questions from a selected Topic at a chosen difficulty.
- **Gaps_Report**: A plain-language AI-generated summary of concepts the User consistently struggles with across Quiz_Sessions.
- **Learning_Plan**: An AI-generated day-by-day study schedule based on the User's goal, target date, uploaded materials, and detected gaps.
- **Subscription**: The User's current payment tier — Free or Premium.
- **Free_Tier**: The default plan with limited daily quiz sessions (3/day), limited uploads (5 total), and basic chat.
- **Premium_Tier**: The paid plan with unlimited sessions, uploads, full Learning_Plan, Gaps_Reports, and priority response speed.
- **Telegram_Link**: A verified association between a User account and a Telegram account.

---

## Requirements

### Requirement 1: User Authentication — Email

**User Story:** As a new learner, I want to register and log in with my email and password, so that I can access my private learning space from any device.

#### Acceptance Criteria

1. WHEN a User submits a valid email and password on the sign-up screen, THE App SHALL send the credentials to the Backend registration endpoint and, upon a successful response, store the returned Access_Token and Refresh_Token securely in the device keychain.
2. WHEN a User submits a valid email and password on the login screen, THE App SHALL authenticate against the Backend and navigate the User to the Dashboard screen.
3. IF the Backend returns a 4xx error during sign-up or login, THEN THE App SHALL display a human-readable error message in the User's currently selected language without clearing the form fields.
4. WHEN an API request returns HTTP 401 and a valid Refresh_Token exists, THE App SHALL automatically request a new Access_Token from the Backend refresh endpoint and retry the original request without prompting the User to log in again.
5. IF the Backend returns HTTP 401 on the token refresh attempt, THEN THE App SHALL clear all stored tokens and navigate the User to the Login screen.
6. WHEN a User taps "Log Out", THE App SHALL delete all stored tokens from the device keychain and navigate to the Login screen.

---

### Requirement 2: User Authentication — Google OAuth

**User Story:** As a learner, I want to sign in with my Google account, so that I can get started without creating a separate password.

#### Acceptance Criteria

1. WHEN a User taps "Continue with Google", THE App SHALL initiate the OAuth flow by opening the Backend's Google OAuth URL in an in-app browser session.
2. WHEN the Google OAuth flow completes successfully, THE App SHALL receive the authorization code, send it to the Backend callback endpoint, and store the returned Access_Token and Refresh_Token securely in the device keychain.
3. IF the Google OAuth flow is cancelled by the User, THEN THE App SHALL return to the Login screen without displaying an error.
4. IF the Backend returns an error during Google OAuth callback processing, THEN THE App SHALL display a descriptive error message on the Login screen.

---

### Requirement 3: User Profile & Learning Goal

**User Story:** As a learner, I want to view my learning statistics and set a goal with a target date, so that I can track my progress and give the AI context for my learning plan.

#### Acceptance Criteria

1. THE App SHALL display a Profile screen showing: total sessions completed, number of topics covered, and a knowledge score trend line over the last 30 days.
2. WHEN a User navigates to the Profile screen, THE App SHALL fetch and display the current learning goal text and target date from the Backend.
3. WHEN a User submits a new learning goal and target date, THE App SHALL persist the data to the Backend and display a confirmation message.
4. IF the target date is in the past, THEN THE App SHALL display an inline validation error and prevent submission.
5. THE App SHALL display the User's name and profile picture (if provided by Google OAuth) on the Profile screen.

---

### Requirement 4: Personal Knowledge Base — Material Upload

**User Story:** As a learner, I want to upload documents or paste text into my knowledge base, so that the AI can learn from my materials and tutor me on them.

#### Acceptance Criteria

1. THE App SHALL support uploading files of the following types: PDF, DOCX, and plain text (.txt).
2. THE App SHALL support pasting plain text content directly into a text input field as an alternative to file upload.
3. WHEN a User initiates a file upload, THE App SHALL display an upload progress indicator until the Backend confirms processing is complete.
4. IF the file size exceeds the Backend-defined limit, THEN THE App SHALL display an error message stating the maximum allowed size before attempting the upload.
5. WHILE a User is on the Free_Tier and has reached 5 uploaded materials, THE App SHALL disable the upload action and display a message prompting the User to upgrade to Premium_Tier.
6. WHEN the Backend confirms a material has been processed, THE App SHALL add the material to the selected Topic in the local list without requiring a full page refresh.

---

### Requirement 5: Personal Knowledge Base — Topic Management

**User Story:** As a learner, I want to organise my materials into named topics, so that I can keep my knowledge base structured and target specific areas for study.

#### Acceptance Criteria

1. THE App SHALL display a list of the User's Topics on the Knowledge Base screen, each showing the topic name and number of materials it contains.
2. WHEN a User creates a new Topic with a non-empty name, THE App SHALL save it to the Backend and display it immediately in the Topic list.
3. WHEN a User renames an existing Topic, THE App SHALL update the name on the Backend and reflect the change in the UI.
4. WHEN a User deletes a Topic, THE App SHALL request confirmation before sending the delete request to the Backend.
5. IF a User attempts to create a Topic with a duplicate name, THEN THE App SHALL display an inline error message.
6. WHEN a User opens a Topic, THE App SHALL display all materials within that Topic, showing each material's filename, upload date, and a delete action.
7. WHEN a User deletes a Material, THE App SHALL request confirmation and, upon confirmation, send the delete request to the Backend and remove it from the list.

---

### Requirement 6: AI Learning Companion — Chat

**User Story:** As a learner, I want to have a conversation with the AI about my uploaded materials, so that I can deepen my understanding by asking questions and receiving grounded explanations.

#### Acceptance Criteria

1. THE App SHALL provide a Chat screen where the User can select a Topic (or "All Topics") as the context for a Chat_Session.
2. WHEN a User sends a message, THE App SHALL display the message immediately in the chat thread and show a loading indicator while awaiting the Backend response.
3. WHEN the Backend returns an AI response, THE App SHALL render the response text with inline citations that reference the specific Material and section from which the answer was drawn.
4. WHEN a User taps a citation, THE App SHALL display the cited source text in a bottom sheet or modal.
5. THE App SHALL display the AI's response in the same language that the User's message was written in (Uzbek, Russian, or English), as determined by the Backend.
6. WHEN a User opens a previous Chat_Session, THE App SHALL load and display the full message history for that session from the Backend.
7. IF the Backend returns an error during a chat request, THEN THE App SHALL display an error message in the chat thread with a retry action.
8. THE App SHALL persist each Chat_Session so the User can return to previous conversations from a session history list.

---

### Requirement 7: Quiz & Practice Mode

**User Story:** As a learner, I want to take AI-generated quizzes on my uploaded materials, so that I can test my understanding and identify what I need to review.

#### Acceptance Criteria

1. THE App SHALL provide a Quiz setup screen where the User selects a Topic and a difficulty level: "Gentle Review", "Solid Understanding", or "Expert Challenge".
2. WHEN a User starts a Quiz_Session, THE App SHALL request questions from the Backend and present the first question.
3. THE App SHALL render the following question types: multiple choice (single correct answer), short answer (free text), and open-ended explanation.
4. WHEN a User submits an answer, THE App SHALL send it to the Backend and display the AI's feedback, which includes whether the answer was correct, an explanation, and a citation pointing to the relevant section in the uploaded material.
5. THE App SHALL display a progress indicator showing the current question number out of the total questions in the session.
6. WHEN a Quiz_Session ends, THE App SHALL display a session summary screen showing the score, number of correct answers, and a breakdown per question.
7. THE App SHALL save each completed Quiz_Session to the Backend so scores are included in the User's progress statistics.
8. WHILE a User is on the Free_Tier and has completed 3 Quiz_Sessions on the current calendar day, THE App SHALL prevent starting a new Quiz_Session and display a message prompting the User to upgrade to Premium_Tier or return the next day.

---

### Requirement 8: Knowledge Gap Detection

**User Story:** As a learner, I want to see a report of my knowledge gaps identified from my quiz history, so that I know exactly which concepts to focus on.

#### Acceptance Criteria

1. THE App SHALL display a Gaps Report screen accessible from the Dashboard and the Profile screen.
2. WHEN a User navigates to the Gaps Report screen, THE App SHALL fetch the latest Gaps_Report from the Backend and display it as a plain-language summary.
3. THE Gaps_Report display SHALL list weak concepts, each paired with a suggested Material section to revisit, rendered as a tappable link that opens the relevant material context.
4. WHILE a User is on the Free_Tier, THE App SHALL display a locked state on the Gaps Report screen with a message explaining that Gaps_Reports require Premium_Tier.
5. WHEN a new Quiz_Session is completed, THE App SHALL indicate on the Gaps Report screen that the report has been updated and prompt the User to refresh.
6. IF fewer than 2 Quiz_Sessions have been completed, THEN THE App SHALL display a message explaining that more quiz sessions are needed before a Gaps_Report can be generated.

---

### Requirement 9: Learning Plan Generator

**User Story:** As a learner, I want the AI to generate a day-by-day study plan based on my goal, target date, and knowledge gaps, so that I have a clear path to follow.

#### Acceptance Criteria

1. THE App SHALL provide a Learning Plan screen showing the current active Learning_Plan if one exists.
2. WHEN a User requests a new Learning_Plan, THE App SHALL send the learning goal, target date, and user ID to the Backend agent endpoint and display a loading state while the plan is generated.
3. THE App SHALL render the Learning_Plan as a scrollable day-by-day list, where each day entry shows the specific materials and sections assigned for that day.
4. WHEN a User taps a material reference in the Learning_Plan, THE App SHALL navigate to the relevant section in the Knowledge_Base.
5. WHEN a new Quiz_Session is completed or a new Material is uploaded, THE App SHALL display a prompt on the Learning Plan screen offering to regenerate the plan to reflect the latest data.
6. WHILE a User is on the Free_Tier, THE App SHALL display a locked state on the Learning Plan screen with a message explaining that the Learning Plan requires Premium_Tier.

---

### Requirement 10: Telegram Bot Integration

**User Story:** As a learner, I want to link my Telegram account and receive daily reminders and run quizzes directly in Telegram, so that I can stay consistent without always opening the app.

#### Acceptance Criteria

1. THE App SHALL provide a Telegram Integration screen within Profile settings showing the current link status (linked / not linked).
2. WHEN a User taps "Link Telegram Account", THE App SHALL open the Backend-provided Telegram deep link so the User can start the Telegram bot and complete the linking flow.
3. WHEN the Backend confirms the Telegram_Link is established, THE App SHALL update the Telegram Integration screen to show the linked Telegram username.
4. WHEN a User sets a daily reminder time, THE App SHALL save the preferred time to the Backend, which schedules the Telegram reminder.
5. WHEN a User taps "Unlink Telegram", THE App SHALL request confirmation and, upon confirmation, send the unlink request to the Backend and reset the Telegram Integration screen to unlinked state.
6. THE App SHALL display the User's current learning streak (consecutive days with at least one completed session) on the Profile screen.

---

### Requirement 11: Payment & Subscription Management

**User Story:** As a learner, I want to subscribe to Premium tier and manage my subscription, so that I can access unlimited sessions, uploads, and all AI features.

#### Acceptance Criteria

1. THE App SHALL display a Subscription screen showing the User's current tier (Free or Premium), the Premium plan price, and a list of features included in each tier.
2. WHEN a User on Free_Tier taps "Upgrade to Premium", THE App SHALL present payment method options: Payme, Click, and Stripe.
3. WHEN a User selects a payment method, THE App SHALL open the corresponding payment provider's checkout flow (via WebView or deep link as appropriate for each provider).
4. WHEN the Backend sends a webhook confirmation of a successful payment, THE App SHALL update the displayed Subscription tier to Premium without requiring the User to log out and back in.
5. WHEN a User taps "Cancel Subscription", THE App SHALL request confirmation and send the cancellation request to the Backend, then display the updated subscription end date.
6. WHEN a User taps "View Billing History", THE App SHALL fetch and display a list of past payments from the Backend, showing date, amount, and payment method for each transaction.
7. IF a payment attempt fails, THEN THE App SHALL display an error message from the payment provider and allow the User to retry or choose a different payment method.

---

### Requirement 12: Multilingual UI

**User Story:** As a learner in Uzbekistan, I want the app's interface to be available in Uzbek, Russian, and English, so that I can use the language I am most comfortable with.

#### Acceptance Criteria

1. THE App SHALL support three interface languages: Uzbek (uz), Russian (ru), and English (en).
2. THE App SHALL default to the device's system language if it is one of the supported languages, and fall back to English otherwise.
3. WHEN a User changes the language setting, THE App SHALL immediately re-render all visible UI text in the selected language without requiring a restart.
4. THE App SHALL persist the selected language preference across app restarts.

---

### Requirement 13: Navigation & Core UX

**User Story:** As a mobile user, I want a clear, native-feeling navigation structure, so that I can move between features intuitively.

#### Acceptance Criteria

1. THE App SHALL implement a bottom tab navigation with the following tabs: Home (Dashboard), Knowledge Base, Chat, Quiz, and Profile.
2. THE App SHALL display a Dashboard screen on the Home tab showing: a greeting, quick-access buttons for starting a quiz or chat, the current learning streak, and a recent activity feed.
3. WHEN the App is launched and no valid Access_Token exists, THE App SHALL display the Login screen and prevent access to all authenticated screens.
4. THE App SHALL support navigating back to the previous screen on all non-root screens using a back action.
5. WHEN the App is launched with a valid Access_Token, THE App SHALL navigate directly to the Dashboard screen without showing the Login screen.

---

### Requirement 14: Offline & Error State Handling

**User Story:** As a mobile user, I want the app to handle network errors gracefully, so that I am never left with a broken or blank screen.

#### Acceptance Criteria

1. WHEN the device has no network connectivity, THE App SHALL display an offline banner and disable actions that require a network request.
2. IF a Backend API request fails with a 5xx error, THEN THE App SHALL display a user-friendly error message and provide a retry action.
3. THE App SHALL cache the most recently loaded Knowledge_Base topic list and Dashboard statistics locally so they remain visible while offline.
4. WHEN the network connection is restored, THE App SHALL automatically dismiss the offline banner and re-enable network-dependent actions.
