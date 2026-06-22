# Testing Guide for Frontend & Backend Integration

## 🧪 How to Run and Test the Application

Since the development environment is not currently accessible in this session, here's a comprehensive guide for you to manually run and test the application.

---

## 🚀 Step 1: Start the Backend Server

### Option A: Using PowerShell Script (Recommended)
```powershell
cd C:\Users\Larry\ilm-ai
.\start_backend.ps1
```

### Option B: Manual Start
```powershell
cd C:\Users\Larry\ilm-ai
python -m uvicorn main:app --reload --port 8000
```

### Expected Backend Output:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Verify Backend is Running:
- Open browser: `http://localhost:8000/docs`
- You should see the FastAPI Swagger documentation
- Check that all endpoints are listed

---

## 🌐 Step 2: Start the Frontend Server

### Option A: Using PowerShell Script (Recommended)
```powershell
cd C:\Users\Larry\ilm-ai-frontend
.\start_frontend.ps1
```

### Option B: Manual Start
```powershell
cd C:\Users\Larry\ilm-ai-frontend
npm install  # Only if dependencies not installed
npm run dev
```

### Expected Frontend Output:
```
▲ Next.js 14.2.3
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

### Verify Frontend is Running:
- Open browser: `http://localhost:3000`
- You should see the Ilm AI homepage

---

## ✅ Step 3: Test the New Features

### 📱 Test 1: Google OAuth Integration

#### Test Login Page:
1. Navigate to `http://localhost:3000/login`
2. **What you should see:**
   - ✅ Regular email/password login form
   - ✅ "Continue with Google" button with Google logo
   - ✅ Button should have proper styling (dark background with white text)
   - ✅ "or" divider between regular login and Google login

#### Test Signup Page:
1. Navigate to `http://localhost:3000/signup`
2. **What you should see:**
   - ✅ Regular signup form (name, email, password)
   - ✅ "Continue with Google" button with Google logo
   - ✅ Button should have proper styling (dark background with white text)
   - ✅ "or" divider between regular signup and Google signup

#### Test Google OAuth Flow:
1. Click "Continue with Google" button on either login or signup page
2. **What should happen:**
   - ✅ Redirect to Google OAuth consent screen
   - ✅ Google login page appears
   - ✅ After authentication, redirect back to `/auth/google-callback`
   - ✅ Brief "Authenticating..." loading screen
   - ✅ Automatic redirect to dashboard
   - ✅ User logged in with valid session
   - ✅ Profile picture loaded (if available from Google)

#### Test OAuth Callback Handler:
1. Manually navigate to `http://localhost:3000/auth/google-callback`
2. **What you should see:**
   - ✅ Error message: "No authorization code received from Google"
   - ✅ Automatic redirect to login page after 3 seconds

---

### 📊 Test 2: Sentry Integration

#### Test Sentry Initialization:
1. Open browser developer console (F12)
2. Navigate to `http://localhost:3000`
3. **What you should see in console:**
   - ✅ No Sentry initialization errors (if DSN not configured)
   - ✅ If DSN configured: "Sentry initialized" message

#### Test Error Tracking:
1. Configure Sentry DSN in `.env`:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=your-actual-dsn-here
   ```
2. Restart frontend server
3. Navigate to `http://localhost:3000/non-existent-page`
4. **What should happen:**
   - ✅ Error page appears
   - ✅ Error captured in Sentry dashboard
   - ✅ Breadcrumb information logged

#### Test API Monitoring:
1. Login to the application
2. Perform various actions (upload files, take quiz, etc.)
3. **What should happen in Sentry:**
   - ✅ API calls tracked with duration
   - ✅ Request/response information logged
   - ✅ Failed API calls captured as errors

#### Test Auth Event Tracking:
1. Login with email/password
2. **What should happen in Sentry:**
   - ✅ `user_login` event captured
   - ✅ User context set (ID, email, name)
   - ✅ Breadcrumb: "User logged in successfully"

3. Logout
4. **What should happen in Sentry:**
   - ✅ `user_logout` event captured
   - ✅ Breadcrumb: "User logged out"

---

### 🔐 Test 3: Regular Authentication

#### Test Email/Password Login:
1. Navigate to `http://localhost:3000/login`
2. Enter email and password
3. Click "Login" button
4. **What should happen:**
   - ✅ Loading state shows
   - ✅ Successful login redirects to dashboard
   - ✅ JWT tokens stored in localStorage
   - ✅ User session active

#### Test Email/Password Signup:
1. Navigate to `http://localhost:3000/signup`
2. Enter name, email, and password
3. Click "Sign Up" button
4. **What should happen:**
   - ✅ Loading state shows
   - ✅ Successful signup redirects to dashboard
   - ✅ JWT tokens stored in localStorage
   - ✅ User session active

---

### 🎯 Test 4: Session Management

#### Test Token Refresh:
1. Login to the application
2. Wait for access token to expire (or modify localStorage)
3. Perform an API call
4. **What should happen:**
   - ✅ Automatic token refresh
   - ✅ API call succeeds with new token
   - ✅ User session maintained

#### Test Logout:
1. Login to the application
2. Click logout button
3. **What should happen:**
   - ✅ Session cleared
   - ✅ Redirected to login page
   - ✅ Tokens removed from localStorage

---

## 🐛 Troubleshooting

### Backend Won't Start:
```powershell
# Check Python installation
python --version

# Install dependencies
pip install -r requirements.txt

# Check database migrations
alembic upgrade head

# Check environment variables
# Ensure .env file exists with proper configuration
```

### Frontend Won't Start:
```powershell
# Check Node.js installation
node --version
npm --version

# Install dependencies
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

### Google OAuth Not Working:
1. Check backend environment variables:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

2. Check Google Cloud Console:
   - Authorized redirect URIs must include: `http://localhost:8000/auth/google-callback`

3. Check backend logs for OAuth errors

### Sentry Not Capturing Errors:
1. Verify DSN is correct in `.env`:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=your-actual-dsn
   ```

2. Check Sentry dashboard for incoming events

3. Verify network requests to Sentry are not blocked

---

## 📋 Testing Checklist

Use this checklist to verify all features are working:

### Backend:
- [ ] Server starts without errors
- [ ] API docs accessible at `http://localhost:8000/docs`
- [ ] Google OAuth endpoints available (`/auth/google-login`, `/auth/google-callback`)
- [ ] Regular auth endpoints working (`/auth/login`, `/auth/signup`)
- [ ] Database migrations applied
- [ ] Environment variables configured

### Frontend:
- [ ] Frontend starts without errors
- [ ] Homepage loads at `http://localhost:3000`
- [ ] Login page accessible
- [ ] Signup page accessible
- [ ] Dashboard accessible after login

### Google OAuth:
- [ ] "Continue with Google" button visible on login page
- [ ] "Continue with Google" button visible on signup page
- [ ] Button has proper styling and Google logo
- [ ] Clicking button redirects to Google
- [ ] Google authentication completes successfully
- [ ] User redirected to dashboard after OAuth
- [ ] Profile picture loaded (if available)
- [ ] User session established with valid tokens

### Sentry:
- [ ] Sentry initializes without errors
- [ ] Errors captured in Sentry dashboard
- [ ] API calls tracked with performance data
- [ ] Auth events (login/logout) tracked
- [ ] User context properly set
- [ ] Sensitive data sanitized in events

### General Functionality:
- [ ] Email/password login works
- [ ] Email/password signup works
- [ ] Token refresh works automatically
- [ ] Logout works correctly
- [ ] Session management functions properly

---

## 🎯 Expected User Flow

### New User with Google OAuth:
1. User visits `http://localhost:3000`
2. Clicks "Login" → redirected to login page
3. Clicks "Continue with Google"
4. Redirects to Google OAuth consent screen
5. User authenticates with Google
6. Redirects back to `/auth/google-callback`
7. Shows "Authenticating..." loading screen
8. Automatic redirect to dashboard
9. User logged in with profile picture from Google

### New User with Email/Password:
1. User visits `http://localhost:3000`
2. Clicks "Sign Up" → redirected to signup page
3. Enters name, email, password
4. Clicks "Sign Up" button
5. Account created successfully
6. Redirected to dashboard
7. User logged in with JWT tokens

### Returning User:
1. User visits `http://localhost:3000`
2. If session exists: redirected to dashboard
3. If no session: redirected to login page
4. User logs in with Google or email/password
5. Redirected to dashboard
6. All previous data accessible

---

## 📝 Notes

- **Google OAuth**: Requires backend configuration with real Google OAuth credentials
- **Sentry**: Requires valid DSN to actually capture errors
- **Development**: Use `localhost` URLs for OAuth redirect URIs
- **Production**: Update redirect URIs to production domain

---

## 🚀 Next Steps After Testing

Once everything is working locally:

1. **Deploy Backend**: Deploy to Railway/Render
2. **Deploy Frontend**: Deploy to Vercel/Netlify
3. **Update OAuth URIs**: Add production redirect URIs to Google Cloud Console
4. **Configure Sentry**: Set up production Sentry project
5. **Update Environment Variables**: Configure production environment
6. **Test Production Flow**: Verify everything works in production

---

**Good luck with testing! Let me know if you encounter any issues.** 🚀
