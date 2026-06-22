import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || "development",
  release: process.env.NEXT_PUBLIC_RELEASE_VERSION || "0.1.0",
  
  // Performance monitoring
  tracesSampleRate: process.env.NEXT_PUBLIC_ENVIRONMENT === "production" ? 0.1 : 1.0,
  
  // Session replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  
  integrations: [
    // Browser profiling
    new Sentry.BrowserProfilingIntegration(),
    // Session replay
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // beforeSend for filtering and sanitization
  beforeSend(event) {
    // Sanitize sensitive data
    if (event.request) {
      if (event.request.headers) {
        // Remove sensitive headers
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
        event.request.headers = Object.fromEntries(
          Object.entries(event.request.headers).filter(([key]) => 
            !sensitiveHeaders.includes(key.toLowerCase())
          )
        );
      }
    }
    
    // Sanitize user data
    if (event.user) {
      // Remove sensitive user fields
      delete event.user.email;
      delete (event.user as any).access_token;
      delete (event.user as any).refresh_token;
    }
    
    return event;
  },
  
  // Filter out certain transactions
  beforeSendTransaction(event) {
    // Filter health checks and static assets
    if (event.transaction) {
      const transaction = event.transaction.toLowerCase();
      if (transaction.includes('health') || 
          transaction.includes('static') ||
          transaction.includes('favicon')) {
        return null;
      }
    }
    return event;
  },
});

export default Sentry;
