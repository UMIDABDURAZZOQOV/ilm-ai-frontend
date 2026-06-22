import * as Sentry from "@sentry/browser";

/**
 * Track a custom event in Sentry
 */
export function trackCustomEvent(event: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    category: "custom",
    message: event,
    level: "info",
    data: data || {},
  });
  
  Sentry.captureEvent({
    message: event,
    level: "info",
    extra: data || {},
  });
}

/**
 * Track an error in Sentry with context
 */
export function trackError(error: Error | string, context?: Record<string, any>) {
  const errorObj = typeof error === "string" ? new Error(error) : error;
  
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(errorObj);
  });
}

/**
 * Set user context in Sentry
 */
export function setUserContext(user: { id: number; email?: string; name?: string }) {
  Sentry.setUser({
    id: String(user.id),
    email: user.email,
    username: user.name,
  });
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(category: string, message: string, level: "info" | "warning" | "error" = "info") {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
  });
}

/**
 * Track API performance
 */
export function trackApiCall(method: string, endpoint: string, statusCode: number, duration: number) {
  Sentry.addBreadcrumb({
    category: "api",
    message: `${method} ${endpoint}`,
    level: statusCode >= 400 ? "error" : "info",
    data: {
      method,
      endpoint,
      status_code: statusCode,
      duration_ms: duration,
    },
  });

  if (statusCode >= 400) {
    Sentry.captureMessage(`API Error: ${method} ${endpoint} returned ${statusCode}`, "error");
  }
}

/**
 * Track external API calls
 */
export function trackExternalApiCall(service: string, endpoint: string, statusCode: number, duration: number) {
  Sentry.addBreadcrumb({
    category: "external_api",
    message: `${service}: ${endpoint}`,
    level: statusCode >= 400 ? "error" : "info",
    data: {
      service,
      endpoint,
      status_code: statusCode,
      duration_ms: duration,
    },
  });
}

/**
 * Track user actions
 */
export function trackUserAction(action: string, details?: Record<string, any>) {
  Sentry.addBreadcrumb({
    category: "user_action",
    message: action,
    level: "info",
    data: details || {},
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature: string, details?: Record<string, any>) {
  trackCustomEvent(`feature_used:${feature}`, details);
}

/**
 * Performance monitoring decorator for functions
 */
export function monitorFunction(functionName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const start = performance.now();
      
      try {
        const result = originalMethod.apply(this, args);
        const duration = performance.now() - start;
        
        Sentry.addBreadcrumb({
          category: "function",
          message: `${functionName} executed`,
          level: "info",
          data: {
            function: functionName,
            duration_ms: duration,
          },
        });
        
        if (duration > 5000) {
          Sentry.captureMessage(`Slow function: ${functionName} took ${duration.toFixed(2)}ms`, "warning");
        }
        
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        trackError(error as Error, {
          function: functionName,
          duration_ms: duration,
        });
        throw error;
      }
    };
    
    return descriptor;
  };
}
