# Frontend Integrations Setup Guide

This document describes the integrations that have been implemented in the ilm-ai frontend and how to configure them.

## 📋 Implemented Integrations

1. **Google OAuth** - Google account login/signup
2. **Sentry Monitoring** - Error tracking and performance monitoring

---

## 🔐 Google OAuth

### Implementation Status
✅ **Fully Implemented**

### What's Included:
- ✅ Google OAuth button on login page
- ✅ Google OAuth button on signup page  
- ✅ OAuth callback handling at `/auth/google-callback`
- ✅ Profile picture support from Google
- ✅ OAuth provider information storage
- ✅ Integration with existing auth system

### Files Modified:
- `src/app/login/page.tsx` - Added Google OAuth button
- `src/app/signup/page.tsx` - Added Google OAuth button
- `src/app/auth/google-callback/page.tsx` - OAuth callback handler (new file)
- `src/hooks/useAuth.tsx` - Enhanced to support OAuth fields
- `src/lib/api.ts` - Enhanced session data structure

### Setup Instructions:

1. **Configure Backend Google OAuth**
   - Follow the backend setup instructions in `INTEGRATIONS_SETUP.md`
   - Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in backend `.env`

2. **Frontend Configuration**
   - No additional frontend configuration required
   - The frontend uses the backend API for OAuth flow
   - Ensure `NEXT_PUBLIC_API_URL` is set correctly in `.env`

3. **Testing the Integration**
   - Navigate to `/login` or `/signup`
   - Click "Continue with Google" button
   - Complete Google authentication flow
   - User should be redirected to dashboard with valid session

### OAuth Flow:
1. User clicks "Continue with Google" button
2. Frontend redirects to backend `/auth/google-login` endpoint
3. Backend generates Google OAuth URL with state token
4. User authenticates with Google
5. Google redirects to frontend `/auth/google-callback` with authorization code
6. Frontend calls backend `/auth/google-callback` with code
7. Backend exchanges code for user info and JWT tokens
8. Frontend stores tokens and redirects to dashboard

---

## 📊 Sentry Monitoring

### Implementation Status
✅ **Fully Implemented**

### What's Included:
- ✅ Sentry SDK integration (@sentry/browser, @sentry/react)
- ✅ Client-side error tracking
- ✅ Performance monitoring
- ✅ Custom event tracking
- ✅ API call monitoring
- ✅ User context tracking
- ✅ Sensitive data sanitization
- ✅ Breadcrumb logging
- ✅ Session replay (optional)

### Files Modified:
- `package.json` - Added Sentry dependencies
- `sentry.client.config.ts` - Sentry client configuration (new file)
- `src/app/layout.tsx` - Sentry initialization
- `src/lib/sentry.ts` - Sentry utility functions (new file)
- `src/lib/api.ts` - Integrated API call tracking
- `src/hooks/useAuth.tsx` - Added auth event tracking
- `.env.example` - Added Sentry environment variables

### Setup Instructions:

1. **Install Dependencies**
   ```bash
   npm install @sentry/browser @sentry/react
   ```
   (Already added to package.json)

2. **Create Sentry Project**
   - Go to [Sentry.io](https://sentry.io/)
   - Create a new project (select "React" or "JavaScript")
   - Get your DSN (Data Source Name)

3. **Configure Environment Variables**
   Add to `.env` file:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   NEXT_PUBLIC_ENVIRONMENT=development
   NEXT_PUBLIC_RELEASE_VERSION=0.1.0
   ```

4. **Update Configuration**
   - Edit `sentry.client.config.ts` if needed
   - Adjust sampling rates for performance monitoring
   - Configure session replay settings

### Sentry Features Available:

#### Error Tracking
```typescript
import { trackError } from "@/lib/sentry";

// Track an error with context
trackError(new Error("Something went wrong"), {
  component: "UserProfile",
  action: "save_profile",
});
```

#### Custom Events
```typescript
import { trackCustomEvent } from "@/lib/sentry";

// Track custom events
trackCustomEvent("quiz_completed", {
  difficulty: "hard",
  score: 85,
  time_spent: 120,
});
```

#### User Context
```typescript
import { setUserContext } from "@/lib/sentry";

// Set user context for better error tracking
setUserContext({
  id: user.id,
  email: user.email,
  name: user.name,
});
```

#### Breadcrumbs
```typescript
import { addBreadcrumb } from "@/lib/sentry";

// Add breadcrumbs for debugging
addBreadcrumb("navigation", "User navigated to dashboard", "info");
```

#### API Monitoring
- Automatically tracks all API calls made through `apiFetch()`
- Tracks request duration, status codes, and errors
- Breadcrumbs for API calls
- Error capture for failed requests

#### User Actions
```typescript
import { trackUserAction } from "@/lib/sentry";

// Track user actions
trackUserAction("button_click", {
  button: "submit_quiz",
  page: "quiz",
});
```

### Data Sanitization:
The Sentry integration automatically sanitizes sensitive data:
- ✅ Authorization headers are removed
- ✅ Cookie headers are removed  
- ✅ API keys are removed
- ✅ User emails are removed from events
- ✅ Access/refresh tokens are removed
- ✅ All text is masked in session replay

### Performance Monitoring:
- Function execution timing
- API call duration tracking
- Slow function detection (>5s warning)
- Transaction filtering (excludes health checks, static assets)

---

## 🔍 Testing the Integrations

### Test Google OAuth:
1. Start backend server with Google OAuth configured
2. Start frontend development server
3. Navigate to `/login` or `/signup`
4. Click "Continue with Google" button
5. Complete Google authentication
6. Verify redirect to dashboard with valid session

### Test Sentry:
1. Configure Sentry DSN in `.env`
2. Start frontend development server
3. Trigger an error (e.g., invalid API call)
4. Check Sentry dashboard for error capture
5. Verify breadcrumbs and user context are attached

---

## 🚀 Deployment Checklist

Before deploying to production:

### Google OAuth:
- [ ] Backend Google OAuth configured with production credentials
- [ ] Google Cloud Console has production redirect URI
- [ ] Frontend `NEXT_PUBLIC_API_URL` points to production backend
- [ ] Test OAuth flow in production environment

### Sentry:
- [ ] Sentry project created for production
- [ ] Production DSN configured in deployment environment
- [ ] `NEXT_PUBLIC_ENVIRONMENT=production`
- [ ] `NEXT_PUBLIC_RELEASE_VERSION` set to current version
- [ ] Performance sampling rates adjusted for production
- [ ] Session replay configured (if needed)

---

## 📝 Notes

### Google OAuth:
- The frontend uses the backend's OAuth endpoints
- No client-side Google SDK needed
- State tokens prevent CSRF attacks
- Profile pictures are automatically fetched from Google

### Sentry:
- Sentry only initializes if DSN is configured
- No performance impact when not configured
- All sensitive data is automatically sanitized
- Session replay can be disabled if not needed

---

## 🆘 Troubleshooting

### Google OAuth Issues:
- **"Google OAuth is not configured"**: Check backend environment variables
- **"Invalid redirect URI"**: Ensure redirect URI matches Google Cloud Console
- **"No authorization code"**: Check if Google OAuth flow completed properly
- **"Authentication failed"**: Check backend logs for OAuth callback errors

### Sentry Issues:
- **"Sentry not capturing errors"**: Verify DSN is correct
- **"Missing user context"**: Ensure `setUserContext()` is called after login
- **"Too many events"**: Adjust sampling rates in configuration
- **"Sensitive data in logs"**: Check sanitization rules in beforeSend

---

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Sentry JavaScript Documentation](https://docs.sentry.io/platforms/javascript/)
- [Backend Integrations Guide](../ilm-ai/INTEGRATIONS_SETUP.md)
